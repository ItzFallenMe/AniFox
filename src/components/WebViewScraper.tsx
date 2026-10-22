import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
} from 'react-native-webview/lib/WebViewTypes';
import { buildEmbedUrl, type ServerUrlConfig } from '../utils/streamUrl';
import { DEFAULT_SCRAPER_TIMEOUT_SECONDS } from '../services/servers';

export interface ExtractedStream {
  videoUrl: string;
  isWebM: boolean;
  /** URL of the document that produced the stream (the embed page, or the
   * nested player frame it was promoted to). Used as `Referer`/`Origin` —
   * most CDNs 403 when those do not match the page that played the video. */
  pageUrl?: string;
  /** Same-site cookies for the page that produced the stream. Only set when
   * the stream host shares a registrable domain with that page, so the
   * header is never sent to an unrelated CDN. */
  cookies?: string;
  /** Best guess at the container: `hls`, `dash`, `mp4` or empty. */
  format?: 'hls' | 'dash' | 'mp4' | '';
}

interface WebViewScraperProps {
  /** Playback server to scrape against — base URL + optional custom URL pattern/type label. */
  server: ServerUrlConfig;
  tmdbId: number;
  /** IMDb id (e.g. "tt1375666") — fills the `{imdbId}` placeholder for
   * servers that need it. */
  imdbId?: string | null;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  /** Raw media title — fills the `{slug}` placeholder for servers that need it. */
  title?: string;
  onDataExtracted: (data: ExtractedStream) => void;
  onLoading?: (isLoading: boolean) => void;
  onError?: (error: string) => void;
  /**
   * Temporarily render the WebView full-screen & interactive for debugging
   * (or for manually solving a captcha challenge). Purely a visibility
   * concern — does NOT affect the give-up timeout; see `timeoutSeconds`.
   */
  debug?: boolean;
  /**
   * Seconds to wait after the page finishes loading before giving up if no
   * stream has been found. `0` (or below) means wait indefinitely.
   * Independent of `debug` — a server can need a long/no timeout to solve
   * a captcha even while its WebView stays hidden, and `debug` can be on
   * with a short timeout for a quick look. Defaults to
   * `DEFAULT_SCRAPER_TIMEOUT_SECONDS` (per-server override lives on
   * `PlaybackServer.scraperTimeoutSeconds`, see `useServers.tsx`).
   */
  timeoutSeconds?: number;
  /**
   * Render the WebView visible (and interactive, in case a challenge needs
   * solving) inside a caller-provided box instead of fully hidden — e.g. a
   * small "Testing…" preview window. Ignored when `debug` is true. Pass the
   * sizing/position style (the WebView itself fills it via
   * `StyleSheet.absoluteFill`).
   */
  previewStyle?: StyleProp<ViewStyle>;
  /**
   * Mute every `<video>`/`<audio>` in the embed. Defaults to muted when
   * `debug` is off so a hidden scrape cannot play sound.
   */
  muted?: boolean;
  /**
   * Auto-click play overlays (and rewrite nested iframes to autoplay=true)
   * so a hidden scrape can start the stream. Defaults to on when `debug`
   * is off; debug leaves the page alone so you can tap yourself.
   */
  autoTap?: boolean;
  /**
   * How many times to reload the embed after a load failure (WebView error
   * or a 403/429/5xx response) before reporting an error. Retries back off
   * linearly (900ms, 1.8s, …) and each one gets a fresh WebView, so a
   * Cloudflare challenge that just set `cf_clearance` can succeed on the
   * second pass. Defaults to 2; `0` disables retries.
   */
  maxRetries?: number;
  /**
   * Reload once when the scrape times out without ever seeing a candidate.
   * The retry is capped at 20s so a dead server cannot hold up failover for
   * a second full timeout. Defaults to true.
   */
  retryOnTimeout?: boolean;
}

interface MessageData {
  type: string;
  responseURL?: string;
  isWebM?: boolean;
  format?: '' | 'hls' | 'dash' | 'mp4';
  pageUrl?: string;
  cookies?: string;
  message?: string;
  frame?: string;
}

// A normal mobile Chrome User-Agent. The default Android WebView UA contains a
// "; wv" token that anti-bot systems (e.g. Cloudflare) flag; presenting a
// regular browser UA lets the standard JS + cookie challenge run like it would
// in Chrome. Combined with persisted cookies, once the challenge is passed the
// `cf_clearance` cookie is stored and subsequent loads go straight through.
const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

const TAG = '[AniFoxScraper]';
const log = (...args: unknown[]) => console.log(TAG, ...args);

/** Native-side URL check — mirrors the injected `VIDEO_RE` / `VIDEO_HINT_RE`. */
const NATIVE_VIDEO_RE = /\.(m3u8|mpd|mp4|webm|mkv)($|\?)|m3u8|mpegurl/i;

/** Backoff between scrapes of the same embed, multiplied by the attempt. */
const RETRY_BACKOFF_MS = 900;
/** A timeout recovery gets at most this long, so failover stays snappy. */
const RETRY_TIMEOUT_CAP_MS = 20000;

const BLOCKED_NAVIGATION_SCHEME_RE =
  /^(intent|market|tg|whatsapp|tel|mailto|sms|file|content|javascript):/i;

/**
 * Top-level navigations to ad/popunder networks. With
 * `setSupportMultipleWindows={false}` a `window.open()` popunder takes over
 * the scrape WebView and the real player never loads.
 */
const BLOCKED_TOP_LEVEL_HOST_RE =
  /(doubleclick|googlesyndication|googleadservices|adsterra|popads|propellerads|hilltopads|exoclick|juicyads|trafficjunky|adcash|clickadu|monetag|profitableratecpm|revcontent|onclck|taboola|outbrain|mgid|zedo|criteo|adnxs|rubiconproject)\./i;

/** Subresource/media URLs — an HTTP error on one of these is not a reason to
 * throw away a page that may still be working. */
const STATIC_ASSET_RE =
  /\.(jpe?g|png|gif|webp|svg|ico|css|woff2?|ttf|mp4|webm|m3u8|mpd|vtt|js)(\?|$)/i;

/** Same scheme + host + port. */
const sameOrigin = (a: string, b: string): boolean => {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
};

/** Should the scraper refuse to navigate the main frame to `url`? */
export const isBlockedTopLevelNavigation = (url: string): boolean => {
  if (!url) return false;
  if (BLOCKED_NAVIGATION_SCHEME_RE.test(url)) return true;
  try {
    return BLOCKED_TOP_LEVEL_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

// Injected into the page (and every frame): hooks XMLHttpRequest, fetch(),
// <video>.src, video.js and resource timings to catch video
// (m3u8/mpd/mp4/webm/mkv), walks JSON bodies, and posts the resolved URL back
// to React Native.
//
// Resolved URLs are *ranked* rather than reported on sight. A page typically
// emits several video-looking requests — prerolls, thumbnails, tracker
// beacons, low-bitrate stubs, the real manifest — and whichever arrives first
// is usually not the one that plays. Candidates are scored (playlist/master
// HLS > DASH > MP4, media-element evidence > JSON > resource timing, minus
// ad/proxied/thumbnail penalties), a strong candidate commits immediately and
// a weaker field gets `SETTLE_MS` to improve. The best candidate is flushed
// on timeout so a scrape that *did* find something never returns nothing.
//
// `timeoutMs` (the same give-up timeout the component arms in
// `handleLoadEnd`) is threaded in so the page-side center-click retry loop
// knows when to stop trying — `<= 0` means "no timeout" (retry indefinitely,
// matching the component's own "wait indefinitely" semantics).
export const buildInjectedJavaScript = (
  timeoutMs: number,
  muted: boolean,
  autoTap: boolean,
) => `
(function() {
  function post(p) {
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(p));
    } catch (e) {}
  }
  function log(m) { post({ type: 'log', message: String(m), frame: location.href }); }

  var VIDEO_RE = /\\.(m3u8|mpd|mp4|webm|mkv)($|\\?)/i;
  var VIDEO_HINT_RE = /m3u8|mpegurl|\\.mpd($|\\?)/i;
  var SKIP_RE = /\\.(jpe?g|png|gif|webp|svg|ico|css|woff2?|js|vtt|srt)($|\\?)/i;
  var SKIP_HOST_RE = /image\\.tmdb\\.org|wsrv\\.nl|googletagmanager|doubleclick|adsystem|google-analytics|clarity\\.ms|yandex/i;
  // Ads, trackers and non-playable decoys. Scored far below real streams so a
  // preroll that loads first never wins, and dropped outright when they also
  // match SKIP_HOST_RE.
  var AD_HOST_RE = /doubleclick|googlesyndication|googleadservices|adsterra|popads|propellerads|hilltopads|exoclick|juicyads|trafficjunky|adcash|clickadu|monetag|profitableratecpm|revcontent|onclck|taboola|outbrain|zedo|criteo|adnxs|rubiconproject|adsystem/i;
  var AD_PATH_RE = /\\/(ads?|adserver|advert|adverts|preroll|midroll|vast|vpaid|banner|popunder|tracking|tracker|analytics|beacon)(\\/|$)/i;
  var NONSTREAM_PATH_RE = /\\/(posters?|thumbnails?|thumbs?|sprites?|storyboards?|subtitles?|captions?|trailers?|teasers?)(\\/|$)/i;

  function isHttpUrl(url) {
    return typeof url === 'string' && /^https?:\\/\\//i.test(url);
  }
  function isSkippable(url) {
    return !isHttpUrl(url) || SKIP_RE.test(url) || SKIP_HOST_RE.test(url);
  }

  // ---------------------------------------------------------------- stealth
  // Cheap, non-destructive cover for the handful of signals embed pages
  // actually check. Everything is masked so Function.prototype.toString
  // still reports "[native code]" for the functions we replaced.
  function maskNative(fn, name) {
    try {
      Object.defineProperty(fn, '__anifoxNativeName', { value: name });
    } catch (e) {}
    return fn;
  }

  if (!window.__anifoxStealth) {
    window.__anifoxStealth = true;
    try {
      var origFnToString = Function.prototype.toString;
      maskNative(origFnToString, 'toString');
      Function.prototype.toString = maskNative(function() {
        var name = this && this.__anifoxNativeName;
        if (name) return 'function ' + name + '() { [native code] }';
        return origFnToString.call(this);
      }, 'toString');
    } catch (e) {}

    try {
      var navProto = Object.getPrototypeOf(navigator);
      var defineNav = function(name, value) {
        try {
          Object.defineProperty(navProto, name, {
            configurable: true,
            get: function() { return value; }
          });
        } catch (e) {}
      };
      // The single strongest headless signal.
      defineNav('webdriver', false);
      if (!navigator.languages || navigator.languages.length === 0) {
        defineNav('languages', ['en-US', 'en']);
      }
      if (typeof navigator.hardwareConcurrency !== 'number' || navigator.hardwareConcurrency < 4) {
        defineNav('hardwareConcurrency', 8);
      }
      if (!navigator.deviceMemory) defineNav('deviceMemory', 8);
    } catch (e) {}

    try {
      if (!window.chrome) {
        window.chrome = { runtime: {}, app: { isInstalled: false }, csi: function() {}, loadTimes: function() {} };
      }
    } catch (e) {}

    // Chrome reports "default" for backgrounded notification permission and
    // some embeds only start their player when it looks like a real browser.
    try {
      var permissions = navigator.permissions;
      if (permissions && permissions.query) {
        var origQuery = permissions.query;
        permissions.query = maskNative(function(desc) {
          if (desc && desc.name === 'notifications') {
            return Promise.resolve({ state: 'prompt', onchange: null });
          }
          return origQuery.apply(permissions, arguments);
        }, 'query');
      }
    } catch (e) {}
  }

  // -------------------------------------------------------------- candidates
  var CANDIDATES = {};
  var CANDIDATE_ORDER = [];
  var MAX_CANDIDATES = 16;
  var SETTLE_MS = 900;
  var COMMIT_SCORE = 62;   // commit as soon as something this good shows up
  var MIN_COMMIT_SCORE = 22; // after settling, take the best of a weak field
  var settleTimer = null;
  var committed = false;

  function isStreamFound() { return committed; }

  function normalizeUrl(url) {
    try {
      var u = new URL(url, location.href);
      u.hash = '';
      return u.href;
    } catch (e) {
      return String(url).split('#')[0];
    }
  }
  function hostOf(url) {
    try { return new URL(url, location.href).hostname.toLowerCase(); } catch (e) { return ''; }
  }
  function registrableDomain(host) {
    var parts = String(host || '').toLowerCase().replace(/\\.$/, '').split('.');
    if (parts.length <= 2) return parts.join('.');
    return parts.slice(-2).join('.');
  }
  // Only hand the page's cookies to hosts on the same site — never leak them
  // to an unrelated CDN that happens to serve the manifest.
  function cookiesFor(url) {
    try {
      if (!document.cookie) return '';
      if (registrableDomain(hostOf(url)) !== registrableDomain(location.hostname)) return '';
      return document.cookie;
    } catch (e) {
      return '';
    }
  }

  function kindScore(url) {
    var u = String(url).toLowerCase();
    if (/\\.m3u8($|\\?)/.test(u) || u.indexOf('mpegurl') !== -1) return 40;
    if (/\\.mpd($|\\?)/.test(u)) return 34;
    if (/\\.mp4($|\\?)/.test(u)) return 28;
    if (/\\.webm($|\\?)/.test(u)) return 26;
    if (/\\.mkv($|\\?)/.test(u)) return 24;
    return 12;
  }
  var SOURCE_SCORE = {
    'video.playing': 46,
    'videojs.currentSource': 34,
    'video.currentSrc': 34,
    'videojs.src': 28,
    'video.src': 26,
    'video.attr': 24,
    'json.playlist': 24,
    'json.file': 18,
    'json.url': 16,
    'perf': 4,
    'nav': 6
  };
  function sourceScore(source) {
    source = String(source || '');
    if (SOURCE_SCORE[source] != null) return SOURCE_SCORE[source];
    if (/hls|dash/.test(source) && /json|fetch|xhr/.test(source)) return 30;
    if (/^video/.test(source)) return 24;
    if (/playlist/.test(source)) return 24;
    return 10;
  }

  function addCandidate(rawUrl, source, opts) {
    if (committed) return;
    if (!isHttpUrl(rawUrl) || isSkippable(rawUrl)) return;
    var url = normalizeUrl(rawUrl);
    var score = kindScore(url) + sourceScore(source);
    if (opts && opts.master) score += 14;
    if (opts && opts.playlist) score += 8;
    if (opts && opts.proxied) score -= 25;
    if (AD_HOST_RE.test(url) || AD_PATH_RE.test(url)) score -= 100;
    if (NONSTREAM_PATH_RE.test(url)) score -= 40;

    var existing = CANDIDATES[url];
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.source = source;
        existing.master = !!(opts && opts.master);
        maybeCommit(false);
      }
      return;
    }
    if (CANDIDATE_ORDER.length >= MAX_CANDIDATES) return;

    var entry = {
      url: url,
      score: score,
      source: source,
      master: !!(opts && opts.master),
      at: Date.now()
    };
    CANDIDATES[url] = entry;
    CANDIDATE_ORDER.push(entry);
    log('candidate ' + score + ' ' + source + ' ' + url);
    // Native uses this to tell "found nothing" from "found but late".
    post({ type: 'candidate' });

    if (settleTimer === null) {
      settleTimer = setTimeout(function() {
        settleTimer = null;
        maybeCommit(true);
      }, SETTLE_MS);
    }
    maybeCommit(false);
  }

  function bestCandidate() {
    var best = null;
    for (var i = 0; i < CANDIDATE_ORDER.length; i++) {
      if (!best || CANDIDATE_ORDER[i].score > best.score) best = CANDIDATE_ORDER[i];
    }
    return best;
  }

  function formatOf(entry) {
    var u = entry.url.toLowerCase();
    if (/\\.m3u8($|\\?)/.test(u) || u.indexOf('mpegurl') !== -1) return 'hls';
    if (/\\.mpd($|\\?)/.test(u)) return 'dash';
    if (/\\.(mp4|webm|mkv)($|\\?)/.test(u)) return 'mp4';
    return entry.master ? 'hls' : '';
  }

  function commit(entry) {
    if (committed || !entry) return;
    committed = true;
    window.__anifoxStreamFound = true;
    if (settleTimer !== null) {
      clearTimeout(settleTimer);
      settleTimer = null;
    }
    log('committing ' + entry.score + ' ' + entry.source + ' ' + entry.url);
    post({
      type: 'video',
      responseURL: entry.url,
      isWebM: /\\.webm($|\\?)/i.test(entry.url),
      format: formatOf(entry),
      pageUrl: location.href,
      cookies: cookiesFor(entry.url)
    });
    stopCenterClicking();
  }

  function maybeCommit(settled) {
    if (committed) return;
    var best = bestCandidate();
    if (!best) return;
    if (!settled && best.score < COMMIT_SCORE) return;
    if (settled && best.score < MIN_COMMIT_SCORE) return;
    commit(best);
  }

  // Hand over the best URL seen so far — but never an ad/tracker just because
  // it was the only thing on the page.
  function flushCandidates() {
    if (committed) return false;
    var best = bestCandidate();
    if (!best || best.score < MIN_COMMIT_SCORE) return false;
    commit(best);
    return committed;
  }

  function emitVideo(url, source, opts) {
    addCandidate(url, source, opts);
  }
  function reportIfVideo(url, source, opts) {
    if (!url || (!VIDEO_RE.test(url) && !VIDEO_HINT_RE.test(url))) return;
    addCandidate(url, source, opts);
  }
  function reportPlaylist(url, source, opts) {
    addCandidate(url, source, opts);
  }
  function reportMediaSrc(url, source) {
    reportIfVideo(url, source);
  }

  function walkJson(node) {
    if (!node || isStreamFound()) return;
    if (typeof node === 'string') {
      reportIfVideo(node, 'json');
      return;
    }
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length && !isStreamFound(); i++) walkJson(node[i]);
      return;
    }
    if (typeof node !== 'object') return;
    // VidLink (and similar): { stream: { playlist, requiresProxy, qualities } }.
    // If the playlist needs their proxy rewrite, skip it and wait for the
    // player to request the rewritten URL (caught via fetch/video.src).
    if (typeof node.playlist === 'string') {
      if (node.requiresProxy !== true) {
        reportPlaylist(node.playlist, 'json.playlist');
      } else {
        addCandidate(node.playlist, 'json.playlist', { proxied: true });
      }
      if (isStreamFound()) return;
    }
    if (typeof node.file === 'string') reportIfVideo(node.file, 'json.file');
    if (isStreamFound()) return;
    if (typeof node.url === 'string' && isHttpUrl(node.url)) {
      var kind = String(node.type || node.kind || node.format || '').toLowerCase();
      if (VIDEO_RE.test(node.url) || VIDEO_HINT_RE.test(node.url) || /^(hls|dash|mp4|mpegurl|m3u8|mpd)$/i.test(kind)) {
        addCandidate(node.url, 'json.url');
        if (isStreamFound()) return;
      }
    }
    for (var key in node) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
      if (key === 'playlist' || key === 'file') continue;
      walkJson(node[key]);
      if (isStreamFound()) return;
    }
  }

  function inspectBody(text, url, source) {
    if (!text || isStreamFound()) return;
    var trimmed = String(text).trim();
    if (trimmed.indexOf('#EXTM3U') === 0) {
      var isMaster = /#EXT-X-STREAM-INF/i.test(trimmed);
      reportPlaylist(url, source + '-hls', { playlist: true, master: isMaster });
      return;
    }
    if (trimmed.indexOf('<') === 0 && /<MPD[\\s>]/i.test(trimmed.slice(0, 400))) {
      reportPlaylist(url, source + '-dash', { playlist: true });
      return;
    }
    if (trimmed.charAt(0) !== '{' && trimmed.charAt(0) !== '[') return;
    try { walkJson(JSON.parse(trimmed)); } catch (e) {}
  }

  // ----------------------------------------------------- frame traversal
  // Android WebView injects this script into every frame, but same-origin
  // frames can still have already-initialized players whose requests we only
  // see by reading their documents directly.
  function viewOf(doc) {
    try { return (doc && doc.defaultView) || window; } catch (e) { return window; }
  }
  function forEachDocument(visit, depth, doc) {
    depth = depth || 0;
    doc = doc || document;
    try { visit(doc); } catch (e) {}
    if (depth >= 3) return;
    var frames;
    try { frames = doc.querySelectorAll('iframe, frame'); } catch (e) { return; }
    for (var i = 0; i < frames.length; i++) {
      var inner = null;
      try { inner = frames[i].contentDocument; } catch (e) { inner = null; }
      if (inner && inner.documentElement) forEachDocument(visit, depth + 1, inner);
    }
  }

  log('hook installed');

  var MUTE_MEDIA = ${muted ? 'true' : 'false'};
  function muteMedia(doc) {
    if (!MUTE_MEDIA) return;
    doc = doc || document;
    var nodes = doc.querySelectorAll('video, audio');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].muted = true;
      nodes[i].defaultMuted = true;
      try { nodes[i].volume = 0; } catch (e) {}
    }
  }
  if (MUTE_MEDIA && !window.__anifoxScraperMuted) {
    window.__anifoxScraperMuted = true;
    forEachDocument(muteMedia);
    setInterval(function() { forEachDocument(muteMedia); }, 1000);
    try {
      new MutationObserver(function() { forEachDocument(muteMedia); }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    } catch (e) {}
  }

  // Lowercase autoplay=true — nxsha/Videasy/VidFast check
  // searchParams.get("autoplay") === "true"; autoplay=1 and autoPlay=true are ignored.
  function withAutoplay(url, base) {
    if (!url || url === 'about:blank' || url === 'about:srcdoc') return url;
    try {
      var u = new URL(url, base || location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return url;
      var current = u.searchParams.get('autoplay') || u.searchParams.get('autoPlay');
      if (current === 'true') return url;
      u.searchParams.set('autoplay', 'true');
      return u.toString();
    } catch (e) {
      return url;
    }
  }

  function harvestDoc(doc) {
    if (isStreamFound()) return;
    var win = viewOf(doc);

    var nodes = doc.querySelectorAll('video');
    for (var i = 0; i < nodes.length; i++) {
      var v = nodes[i];
      var url = v.currentSrc || v.getAttribute('src') || '';
      if (!url || url.indexOf('blob:') === 0) continue;
      reportIfVideo(url, 'video.currentSrc');
      if (!v.paused && isHttpUrl(url) && !isSkippable(url) &&
          url.split('#')[0] !== location.href.split('#')[0]) {
        addCandidate(url, 'video.playing');
      }
    }

    try {
      if (win.videojs && typeof win.videojs.getPlayers === 'function') {
        var players = win.videojs.getPlayers();
        for (var k in players) {
          var p = players[k];
          if (!p || typeof p.currentSource !== 'function') continue;
          var src = p.currentSource();
          var u = src && (src.src || src.url);
          var mime = (src && src.type) || '';
          if (!u) continue;
          reportIfVideo(u, 'videojs.currentSource');
          if (isHttpUrl(u) && !isSkippable(u) && /mpegurl|m3u8|mp4|dash|mpd/i.test(mime)) {
            addCandidate(u, 'videojs.currentSource');
          }
        }
      }
    } catch (e) {}

    // Resource timings for frames our PerformanceObserver never saw.
    try {
      var perf = win.performance;
      if (perf && typeof perf.getEntriesByType === 'function') {
        var entries = perf.getEntriesByType('resource');
        for (var j = 0; j < entries.length; j++) {
          reportIfVideo(entries[j].name, 'perf');
        }
      }
    } catch (e) {}
  }

  function harvestPlayingVideo() {
    if (isStreamFound()) return;
    forEachDocument(harvestDoc);
  }

  if (!window.__anifoxScraperHooked) {
  window.__anifoxScraperHooked = true;

  var originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = maskNative(function() {
    this.addEventListener('load', function() {
      try {
        var responseURL = this.responseURL;
        if (!responseURL) return;
        log('xhr ' + responseURL);
        reportIfVideo(responseURL, 'xhr');
        var text = this.responseType === '' || this.responseType === 'text'
          ? (typeof this.responseText === 'string' ? this.responseText : '')
          : '';
        inspectBody(text, responseURL, 'xhr');
      } catch (error) {
        log('xhr listener error: ' + error);
      }
    });
    return originalOpen.apply(this, arguments);
  }, 'open');

  if (window.fetch) {
    var originalFetch = window.fetch;
    window.fetch = maskNative(function(input, init) {
      var requestUrl = typeof input === 'string' ? input : (input && input.url);
      return originalFetch.apply(this, arguments).then(function(response) {
        try {
          var responseURL = response.url || requestUrl;
          log('fetch ' + responseURL);
          reportIfVideo(responseURL, 'fetch');
          var ct = '';
          try { ct = (response.headers && response.headers.get('content-type')) || ''; } catch (e) {}
          if (!ct || /json|mpegurl|m3u8|dash|mpd|text|octet-stream|video|application\\/vnd/i.test(ct) || /\\/api\\//i.test(responseURL || '')) {
            response.clone().text().then(function(text) {
              inspectBody(text, responseURL, 'fetch');
            }).catch(function() {});
          }
        } catch (error) {
          log('fetch listener error: ' + error);
        }
        return response;
      });
    }, 'fetch');
  }

  try {
    var mediaProto = window.HTMLMediaElement && window.HTMLMediaElement.prototype;
    if (mediaProto && !mediaProto.__anifoxSrcHooked) {
      mediaProto.__anifoxSrcHooked = true;
      var srcDesc = Object.getOwnPropertyDescriptor(mediaProto, 'src');
      if (srcDesc && srcDesc.set) {
        Object.defineProperty(mediaProto, 'src', {
          configurable: true,
          enumerable: srcDesc.enumerable,
          get: function() { return srcDesc.get.call(this); },
          set: maskNative(function(v) {
            reportMediaSrc(String(v || ''), 'video.src');
            srcDesc.set.call(this, v);
          }, 'set src')
        });
      }
      var origSetAttr = mediaProto.setAttribute;
      mediaProto.setAttribute = maskNative(function(name, value) {
        if (String(name).toLowerCase() === 'src') {
          reportMediaSrc(String(value || ''), 'video.attr');
        }
        return origSetAttr.apply(this, arguments);
      }, 'setAttribute');
    }
  } catch (e) {}

  // ScreenScape (video.js) sets the stream via player.src([{src, type}])
  // rather than <video>.src — VHS then fetches HLS, but the src URL often
  // has no .m3u8 suffix. Wrap Player.prototype.src once video.js loads.
  function hookVideoJsSrc() {
    try {
      var vjs = window.videojs;
      if (!vjs || vjs.__anifoxSrcHooked) return;
      var Player = vjs.getComponent && vjs.getComponent('Player');
      if (!Player || !Player.prototype || typeof Player.prototype.src !== 'function') return;
      vjs.__anifoxSrcHooked = true;
      var origVjsSrc = Player.prototype.src;
      Player.prototype.src = maskNative(function(source) {
        try {
          var list = Array.isArray(source) ? source : (source ? [source] : []);
          for (var i = 0; i < list.length; i++) {
            var s = list[i];
            var url = typeof s === 'string' ? s : (s && (s.src || s.url));
            var mime = typeof s === 'object' && s ? String(s.type || '') : '';
            if (!url) continue;
            reportIfVideo(String(url), 'videojs.src');
            // Extensionless HLS/mp4: trust video.js's MIME, not a bare http URL
            // (ScreenScape also src()'s failed servers / embed pages).
            if (!isStreamFound() && isHttpUrl(url) && !isSkippable(url) &&
                /mpegurl|m3u8|mp4|dash|mpd/i.test(mime)) {
              addCandidate(String(url), 'videojs.src');
            }
          }
        } catch (e) {}
        return origVjsSrc.apply(this, arguments);
      }, 'src');
      log('videojs.src hooked');
    } catch (e) {}
  }
  hookVideoJsSrc();
  harvestPlayingVideo();
  setInterval(function() {
    hookVideoJsSrc();
    harvestPlayingVideo();
  }, 1000);

  try {
    new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        reportIfVideo(entries[i].name, 'perf');
      }
    }).observe({ type: 'resource', buffered: true });
  } catch (e) {}

  // VidSrc (and similar wrappers) load the real player in a nested iframe
  // *without* forwarding autoplay, and often with a sandbox attribute that
  // blocks playback. Normalize iframe URLs to autoplay=true (the value
  // nxsha / Videasy / VidFast actually check — autoplay=1 is ignored)
  // and strip sandbox *before* the iframe navigates.
  try {
    var iframeProto = window.HTMLIFrameElement && window.HTMLIFrameElement.prototype;
    if (iframeProto && !iframeProto.__anifoxSrcHooked) {
      iframeProto.__anifoxSrcHooked = true;
      var iframeSrcDesc = Object.getOwnPropertyDescriptor(iframeProto, 'src');
      if (iframeSrcDesc && iframeSrcDesc.set) {
        Object.defineProperty(iframeProto, 'src', {
          configurable: true,
          enumerable: iframeSrcDesc.enumerable,
          get: function() { return iframeSrcDesc.get.call(this); },
          set: maskNative(function(v) {
            iframeSrcDesc.set.call(this, withAutoplay(String(v || '')));
          }, 'set src')
        });
      }
      var origIframeSetAttr = iframeProto.setAttribute;
      iframeProto.setAttribute = maskNative(function(name, value) {
        var n = String(name).toLowerCase();
        if (n === 'sandbox') {
          log('blocked iframe sandbox');
          return;
        }
        if (n === 'src') value = withAutoplay(String(value || ''));
        return origIframeSetAttr.apply(this, arguments);
      }, 'setAttribute');
    }
  } catch (e) {}

  } // __anifoxScraperHooked

  // Many embed players only start (and issue their video request) once
  // their "play" overlay is clicked. VidSrc in particular ignores
  // autoplay on its own URL and loads the real player in a nested iframe
  // — a MouseEvent on that <iframe> does not reach the inner document, so
  // we also: strip sandbox, rewrite iframe src to autoplay=true, call
  // video.play() (WebView has mediaPlaybackRequiresUserAction=false), and
  // recurse into same-origin frames. Retries until a stream is found or
  // timeoutMs elapses.
  var CENTER_CLICK_INTERVAL_MS = 1000;
  var CENTER_CLICK_TIMEOUT_MS = ${timeoutMs};
  var centerClickIntervalId = null;
  var centerClickStartedAt = 0;

  var PLAY_BUTTON_SELECTORS = [
    '.vjs-big-play-button',
    '.jw-icon-playback',
    '.jw-display-icon-container',
    '.jw-display-icon-container .jw-icon-display',
    '.plyr__control--overlaid',
    '.plyr__control[data-plyr="play"]',
    '.mejs-overlay-play',
    '.mejs-overlay-button',
    '.fluid_initial_play',
    '.fluid_initial_play_button',
    '.clappr-play-wrapper',
    '.vjs-poster',
    'button.vjs-big-play-button',
    // YouTube iframe API, Shaka, DPlayer, ArtPlayer, Flowplayer.
    '.ytp-large-play-button',
    '.shaka-play-button',
    '.dplayer .dplayer-play-icon',
    '.dplayer-play-icon',
    '.artplayer .artplayer-play-icon',
    '.artplayer-play-icon',
    '.flowplayer .fp-play',
    '.fp-play',
    // Generic hand-rolled overlays.
    '#play-button',
    '#playButton',
    '[data-testid="play-button"]',
    '[data-testid="player-play"]',
    '[aria-label*="play" i]',
    '[title="Play" i]',
    '[title="play" i]',
  ];
  var PLAY_CLASS_RE = /play-btn|playbtn|playbutton|play-button|big-play|overlay-play|icon-play|play-icon|play-overlay|player-play|fp-play|shaka-play|dplayer-play|artplayer-play/i;
  var PLAY_TEXT_RE = /^(play|play now|play video|watch now|start watching|tap to play|click to play)$/i;

  function classNameOf(el) {
    var cls = el.className;
    if (!cls) return '';
    if (typeof cls === 'string') return cls;
    if (typeof cls.baseVal === 'string') return cls.baseVal;
    return String(cls);
  }

  function inPlayerChrome(el) {
    var n = el;
    var root = el && el.ownerDocument;
    while (n && n !== root && n !== (root && root.documentElement)) {
      var c = classNameOf(n).toLowerCase();
      if (c.indexOf('controls-bar') !== -1 || c.indexOf('control-bar') !== -1 ||
          c.indexOf('vjs-control') !== -1) return true;
      n = n.parentElement;
    }
    return false;
  }

  function isVisible(el) {
    var rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;
    var win = (el.ownerDocument && el.ownerDocument.defaultView) || window;
    var style = win.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false;
    return true;
  }

  function findBySelector(doc) {
    doc = doc || document;
    for (var i = 0; i < PLAY_BUTTON_SELECTORS.length; i++) {
      try {
        var matches = doc.querySelectorAll(PLAY_BUTTON_SELECTORS[i]);
        for (var j = 0; j < matches.length; j++) {
          if (isVisible(matches[j]) && !inPlayerChrome(matches[j])) return matches[j];
        }
      } catch (e) {}
    }
    return null;
  }

  function findByText(doc) {
    doc = doc || document;
    var candidates = doc.querySelectorAll('button, [role="button"], a, div, span');
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      var text = (el.textContent || '').trim();
      if (text && text.length <= 24 && PLAY_TEXT_RE.test(text) && isVisible(el) && !inPlayerChrome(el)) return el;
    }
    return null;
  }

  function findByClassPlay(doc) {
    doc = doc || document;
    var candidates = doc.querySelectorAll('button, [role="button"], a, div, span, i');
    for (var i = 0; i < candidates.length; i++) {
      if (PLAY_CLASS_RE.test(classNameOf(candidates[i])) && isVisible(candidates[i]) && !inPlayerChrome(candidates[i])) {
        return candidates[i];
      }
    }
    return null;
  }

  // Icon-only circular play buttons (e.g. nxsha's rounded-full SVG button)
  // have no "play" class/label and often no cursor:pointer.
  function findCenterIconButton(doc) {
    doc = doc || document;
    var win = viewOf(doc);
    var vw = win.innerWidth || window.innerWidth;
    var vh = win.innerHeight || window.innerHeight;
    var cx = vw / 2;
    var cy = vh / 2;
    var maxDist = Math.min(vw, vh) * 0.45;
    var buttons = doc.querySelectorAll('button, [role="button"]');
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < buttons.length; i++) {
      var el = buttons[i];
      var rect = el.getBoundingClientRect();
      if (!isVisible(el) || inPlayerChrome(el)) continue;
      if (rect.width < 24 || rect.height < 24) continue;
      if (rect.width > 220 || rect.height > 220) continue;
      var label = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
      var hasIcon = !!el.querySelector('svg, i') || /play/.test(label);
      var text = (el.textContent || '').trim();
      var looksRound = Math.abs(rect.width - rect.height) < 16;
      if (!hasIcon && !(looksRound && !text)) continue;
      var dist = Math.sqrt(
        Math.pow(rect.left + rect.width / 2 - cx, 2) +
        Math.pow(rect.top + rect.height / 2 - cy, 2)
      );
      if (dist <= maxDist && dist < bestDist) {
        best = el;
        bestDist = dist;
      }
    }
    return best;
  }

  function findNearCenterClickable(doc) {
    doc = doc || document;
    var win = viewOf(doc);
    var vw = win.innerWidth || window.innerWidth;
    var vh = win.innerHeight || window.innerHeight;
    var cx = vw / 2;
    var cy = vh / 2;
    var maxDist = Math.min(vw, vh) * 0.4;
    var candidates = doc.querySelectorAll('button, [role="button"], a, div, span, svg, path, i, label');
    var best = null;
    var bestScore = Infinity;
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      var rect = el.getBoundingClientRect();
      if (rect.width < 16 || rect.height < 16) continue;
      if (rect.width > vw * 0.7 && rect.height > vh * 0.7) continue;
      var ex = rect.left + rect.width / 2;
      var ey = rect.top + rect.height / 2;
      var dist = Math.sqrt((ex - cx) * (ex - cx) + (ey - cy) * (ey - cy));
      if (dist > maxDist) continue;
      if (!isVisible(el) || inPlayerChrome(el)) continue;
      var tag = (el.tagName || '').toLowerCase();
      var style = win.getComputedStyle(el);
      var clickable = tag === 'button' || el.getAttribute('role') === 'button' || style.cursor === 'pointer';
      if (!clickable) continue;
      var score = dist + rect.width * rect.height * 0.02;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best;
  }

  function findVideoEl(doc) {
    doc = doc || document;
    var nodes = doc.querySelectorAll('video');
    for (var i = 0; i < nodes.length; i++) {
      if (isVisible(nodes[i]) || nodes[i].readyState > 0) return nodes[i];
    }
    return nodes[0] || null;
  }

  function findPlayButton(doc) {
    return findBySelector(doc) || findByText(doc) || findByClassPlay(doc) ||
      findCenterIconButton(doc) || findNearCenterClickable(doc) || findVideoEl(doc);
  }

  function dispatchClick(el, x, y) {
    var win = (el.ownerDocument && el.ownerDocument.defaultView) || window;
    var opts = {
      bubbles: true,
      cancelable: true,
      view: win,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 1,
    };
    try {
      el.dispatchEvent(new win.PointerEvent('pointerdown', {
        bubbles: true, cancelable: true, view: win,
        clientX: x, clientY: y, button: 0, buttons: 1,
        pointerId: 1, pointerType: 'touch', isPrimary: true
      }));
    } catch (e) {}
    try { el.dispatchEvent(new win.MouseEvent('mousedown', opts)); } catch (e) {}
    try {
      el.dispatchEvent(new win.PointerEvent('pointerup', {
        bubbles: true, cancelable: true, view: win,
        clientX: x, clientY: y, button: 0, buttons: 1,
        pointerId: 1, pointerType: 'touch', isPrimary: true
      }));
    } catch (e) {}
    try { el.dispatchEvent(new win.MouseEvent('mouseup', opts)); } catch (e) {}
    try { el.click(); } catch (e) {}
    try { el.dispatchEvent(new win.MouseEvent('click', opts)); } catch (e) {}
  }

  function playAllMedia(root) {
    root = root || document;
    var win = viewOf(root);
    var nodes = root.querySelectorAll('video, audio');
    for (var i = 0; i < nodes.length; i++) {
      try {
        nodes[i].setAttribute('playsinline', '');
        nodes[i].setAttribute('webkit-playsinline', '');
        if (MUTE_MEDIA) {
          nodes[i].muted = true;
          nodes[i].defaultMuted = true;
        }
        var p = nodes[i].play();
        if (p && p.catch) p.catch(function() {});
      } catch (e) {}
    }
    try {
      if (win.videojs && typeof win.videojs.getPlayers === 'function') {
        var players = win.videojs.getPlayers();
        for (var k in players) {
          if (!players[k]) continue;
          try { if (MUTE_MEDIA && players[k].muted) players[k].muted(true); } catch (e) {}
          try { players[k].play(); } catch (e) {}
        }
      }
    } catch (e) {}
    try {
      if (typeof win.jwplayer === 'function') {
        var jw = win.jwplayer();
        if (jw && jw.play) jw.play();
      }
    } catch (e) {}
  }

  function unlockIframes(doc) {
    doc = doc || document;
    var frames = doc.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (f.hasAttribute('sandbox')) {
        f.removeAttribute('sandbox');
        log('removed iframe sandbox');
      }
      try {
        var allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
        if (f.getAttribute('allow') !== allow) f.setAttribute('allow', allow);
      } catch (e) {}
      var src = f.getAttribute('src') || '';
      if (!src) continue;
      var next = withAutoplay(src, doc.baseURI || location.href);
      if (next && next !== src) {
        log('iframe autoplay rewrite ' + src + ' -> ' + next);
        f.src = next;
      }
    }
  }

  // Android WebView only injects our hooks into the *main* frame, so a
  // VidSrc-style wrapper (video playing in a cross-origin iframe) never
  // reports the stream. Navigate the WebView to that iframe's src so the
  // next load runs the scraper inside the real player document.
  var PLAYER_IFRAME_RE = /\\/embed|\\/player|\\/watch|\\/tv\\/|\\/movie\\/|nxsha|videasy|vidfast|vidsrc|cinesrc|screenscape|vidlink/i;
  function promotePlayerIframe() {
    if (isStreamFound()) return false;
    var count = window.__anifoxPromoteCount || 0;
    if (count >= 3) return false;
    var vw = window.innerWidth || 1;
    var vh = window.innerHeight || 1;
    var frames = document.querySelectorAll('iframe');
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      var src = f.src || f.getAttribute('src') || '';
      if (!src || src === 'about:blank') continue;
      try { src = new URL(src, location.href).href; } catch (e) { continue; }
      if (!isHttpUrl(src) || SKIP_HOST_RE.test(src)) continue;
      if (src.split('#')[0] === location.href.split('#')[0]) continue;
      var rect = f.getBoundingClientRect();
      var fills = rect.width >= vw * 0.45 && rect.height >= vh * 0.45;
      var looksPlayer = PLAYER_IFRAME_RE.test(src);
      if (!fills && !looksPlayer) continue;
      var score = rect.width * rect.height + (looksPlayer ? 10000000 : 0);
      if (score > bestScore) {
        best = src;
        bestScore = score;
      }
    }
    if (!best) return false;
    window.__anifoxPromoteCount = count + 1;
    log('promoting iframe to top: ' + best);
    try { location.replace(best); } catch (e) {}
    return true;
  }

  function clickInsideIframe(iframe, x, y) {
    try {
      var doc = iframe.contentDocument;
      if (!doc) return false;
      var rect = iframe.getBoundingClientRect();
      var ix = x - rect.left;
      var iy = y - rect.top;
      var inner = doc.elementFromPoint(ix, iy) || doc.querySelector('video, button, [role="button"]') || doc.body;
      if (inner && inner !== doc.documentElement) {
        dispatchClick(inner, ix, iy);
        log('clicked inside same-origin iframe: ' + (inner.tagName || 'unknown'));
      }
      playAllMedia(doc);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Walk up to 3 levels of same-origin frames and click their play overlays.
  // Cross-origin frames are invisible to us — those rely on iframe promotion.
  function clickPlayInFrames() {
    if (isStreamFound()) return false;
    var clicked = false;
    forEachDocument(function(doc) {
      if (clicked || isStreamFound() || doc === document) return;
      var el = findBySelector(doc) || findByText(doc) || findByClassPlay(doc);
      if (!el) return;
      var rect = el.getBoundingClientRect();
      dispatchClick(el, Math.floor(rect.left + rect.width / 2), Math.floor(rect.top + rect.height / 2));
      log('clicked play overlay inside same-origin frame');
      clicked = true;
    });
    return clicked;
  }

  function stopCenterClicking() {
    if (centerClickIntervalId !== null && centerClickIntervalId !== undefined) {
      clearInterval(centerClickIntervalId);
      centerClickIntervalId = null;
    }
  }

  function clickCenter() {
    if (isStreamFound()) {
      log('center click: stream already found, stopping retries');
      stopCenterClicking();
      return;
    }
    if (CENTER_CLICK_TIMEOUT_MS > 0 && (Date.now() - centerClickStartedAt) >= CENTER_CLICK_TIMEOUT_MS) {
      // Out of attempts: hand over the best URL we saw rather than nothing.
      if (flushCandidates()) log('center click: committed best candidate at timeout');
      log('center click: timeout reached, stopping retries');
      stopCenterClicking();
      return;
    }
    try {
      forEachDocument(unlockIframes);
      if (promotePlayerIframe()) return;
      forEachDocument(playAllMedia);
      harvestPlayingVideo();
      // ScreenScape's play button toggles pause and its control bar also
      // switches *their* server. Once a <video> is loading/playing, only
      // call play() — a second click pauses the stream and trips failover.
      var videos = document.querySelectorAll('video');
      var mediaArmed = false;
      for (var vi = 0; vi < videos.length; vi++) {
        if (!videos[vi].paused || videos[vi].readyState > 0 || videos[vi].currentSrc) {
          mediaArmed = true;
          break;
        }
      }
      if (mediaArmed) {
        log('video already started, skipping overlay click');
        return;
      }
      if (clickPlayInFrames()) return;
      var target = findPlayButton();
      var x, y;
      if (target) {
        var rect = target.getBoundingClientRect();
        x = Math.floor(rect.left + rect.width / 2);
        y = Math.floor(rect.top + rect.height / 2);
        log('found play button: ' + (classNameOf(target) || target.tagName));
      } else {
        x = Math.floor(window.innerWidth / 2);
        y = Math.floor(window.innerHeight / 2);
        target = document.elementFromPoint(x, y);
        log('no known play button matched, falling back to viewport center');
      }
      if (!target) { log('center click: nothing at ' + x + ',' + y); return; }
      if ((target.tagName || '').toLowerCase() === 'iframe') {
        if (clickInsideIframe(target, x, y)) return;
        log('iframe is cross-origin; promoting instead of clicking');
        if (promotePlayerIframe()) return;
      }
      dispatchClick(target, x, y);
      if ((target.tagName || '').toLowerCase() === 'video') {
        try {
          var playP = target.play();
          if (playP && playP.catch) playP.catch(function() {});
        } catch (e) {}
      }
      log('click dispatched on ' + (target.tagName || 'unknown'));
    } catch (e) {
      log('center click error: ' + e);
    }
  }

  // Start immediately — don't wait for window 'load'. Nested/fast-loading
  // frames often fire load before this script is injected, so a load
  // listener would never run. MutationObserver catches play overlays and
  // iframes that appear after first paint (VidSrc's delayed iframe.src).
  function hidePlayerChrome() {
    if (window.__anifoxChromeHidden || !document.documentElement) return;
    window.__anifoxChromeHidden = true;
    try {
      var s = document.createElement('style');
      s.textContent = '.controls-bar,.vjs-control-bar,.vjs-big-play-button{opacity:0!important;pointer-events:none!important}';
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  }

  function startCenterClickLoop() {
    if (centerClickStartedAt !== 0 || window.__anifoxScraperClicking) return;
    window.__anifoxScraperClicking = true;
    centerClickStartedAt = Date.now();
    hidePlayerChrome();
    forEachDocument(unlockIframes);
    clickCenter();
    centerClickIntervalId = setInterval(clickCenter, CENTER_CLICK_INTERVAL_MS);
    try {
      new MutationObserver(function() {
        if (isStreamFound()) return;
        forEachDocument(unlockIframes);
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  var AUTO_TAP = ${autoTap ? 'true' : 'false'};
  if (AUTO_TAP) {
    startCenterClickLoop();
  } else {
    log('auto tap disabled (debug)');
  }
})();
true;
`;

/**
 * WebView that loads a streaming-server embed page and intercepts the
 * underlying video request via an injected XMLHttpRequest hook, returning the
 * resolved stream URL. When not previewed, it's rendered fully transparent
 * and non-interactive (`styles.hidden`) at *normal screen size* — not a 1x1
 * box — so it never affects layout or catches touches, but still presents a
 * normal-looking viewport to the page. Many ad-supported embeds fingerprint
 * `window.innerWidth/innerHeight` (or use `IntersectionObserver`/size checks
 * before initializing their player) as a bot signal; a 1x1 viewport can make
 * those sites quietly refuse to ever fire the real video request, even
 * though the exact same URL resolves fine in a normally-sized WebView (e.g.
 * the visible "Test" preview in `ServerSettingsScreen`).
 *
 * Reimplementation of the reference `WebViewScrapper` adapted to this app:
 * configurable server (`baseUrl` + `buildEmbedUrl`) and debug logging.
 */
export const WebViewScraper = ({
  server,
  tmdbId,
  imdbId,
  type,
  season,
  episode,
  title,
  onDataExtracted,
  onLoading,
  onError,
  debug = false,
  timeoutSeconds,
  previewStyle,
  muted,
  autoTap,
  maxRetries = 2,
  retryOnTimeout = true,
}: WebViewScraperProps) => {
  const [webViewKey, setWebViewKey] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasExtractedDataRef = useRef(false);
  const attemptRef = useRef(0);
  const sawCandidatesRef = useRef(false);
  const timeoutMs =
    (timeoutSeconds ?? DEFAULT_SCRAPER_TIMEOUT_SECONDS) * 1000;
  // A recovery attempt gets a shorter budget: a server that produced nothing
  // after a full timeout should not be given another full timeout.
  const attemptTimeoutMs =
    attempt === 0 || timeoutMs <= 0
      ? timeoutMs
      : Math.min(timeoutMs, RETRY_TIMEOUT_CAP_MS);

  const embedUrl = useMemo(
    () =>
      buildEmbedUrl(server, { type, tmdbId, imdbId, season, episode, title }),
    [
      server,
      type,
      tmdbId,
      imdbId,
      season,
      episode,
      title,
    ],
  );

  const muteMedia = muted ?? !debug;
  const shouldAutoTap = autoTap ?? !debug;
  const injectedJavaScript = useMemo(
    () => buildInjectedJavaScript(attemptTimeoutMs, muteMedia, shouldAutoTap),
    [attemptTimeoutMs, muteMedia, shouldAutoTap],
  );

  // Reset the WebView (and retry budget) when the target changes.
  useEffect(() => {
    hasExtractedDataRef.current = false;
    sawCandidatesRef.current = false;
    attemptRef.current = 0;
    setAttempt(0);
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    log('loading embed:', embedUrl);
    setWebViewKey((prev) => prev + 1);
  }, [embedUrl]);

  const clearLoadingTimer = useCallback(() => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, []);

  const emitExtracted = useCallback(
    (data: ExtractedStream) => {
      if (hasExtractedDataRef.current) return;
      hasExtractedDataRef.current = true;
      clearLoadingTimer();
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      log(
        'resolved stream:',
        data.videoUrl,
        `(format=${data.format || '?'}, page=${data.pageUrl || '?'})`,
      );
      onDataExtracted(data);
      onLoading?.(false);
    },
    [clearLoadingTimer, onDataExtracted, onLoading],
  );

  const extractFromUrl = useCallback(
    (url?: string) => {
      if (!url || !NATIVE_VIDEO_RE.test(url)) return;
      emitExtracted({
        videoUrl: url,
        isWebM: /\.webm($|\?)/i.test(url),
        format: /\.m3u8|mpegurl/i.test(url)
          ? 'hls'
          : /\.mpd/i.test(url)
            ? 'dash'
            : 'mp4',
      });
    },
    [emitExtracted],
  );

  /**
   * Reload the embed with backoff. Returns false when the retry budget is
   * spent, so the caller can report the failure.
   */
  const scheduleRetry = useCallback(
    (reason: string): boolean => {
      if (hasExtractedDataRef.current) return true;
      // A retry is already queued — don't let a burst of errors burn the
      // whole budget or stack remounts.
      if (retryTimerRef.current) return true;
      const next = attemptRef.current + 1;
      if (next > maxRetries) return false;
      attemptRef.current = next;
      setAttempt(next);
      log(`retrying after ${reason} (attempt ${next}/${maxRetries})`);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        if (hasExtractedDataRef.current) return;
        // Candidates describe one page instance; the reload starts fresh.
        sawCandidatesRef.current = false;
        setWebViewKey(prev => prev + 1);
      }, RETRY_BACKOFF_MS * next);
      return true;
    },
    [maxRetries],
  );

  // Handle messages posted from the page.
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: MessageData;
      try {
        data = JSON.parse(event.nativeEvent.data) as MessageData;
      } catch (error) {
        log('failed to parse message:', error);
        onError?.('Failed to parse video data');
        return;
      }

      if (data.type === 'log') {
        log('page:', data.message);
        return;
      }

      if (data.type === 'candidate') {
        sawCandidatesRef.current = true;
        return;
      }

      if (data.type === 'video' && data.responseURL) {
        emitExtracted({
          videoUrl: data.responseURL,
          isWebM: !!data.isWebM,
          pageUrl: data.pageUrl,
          cookies: data.cookies,
          format: data.format ?? '',
        });
      }
    },
    [emitExtracted, onError],
  );

  const handleLoadStart = useCallback(() => {
    log('load start');
    onLoading?.(true);
  }, [onLoading]);

  // On load end, arm a timeout: if nothing was extracted, try one recovery
  // load (the page usually had nothing at all — a fresh pass often gets past
  // a challenge that had just been solved), then give up. This is
  // deliberately independent of `debug` (visibility) — a `0`/negative
  // `timeoutSeconds` (per-server "no timeout") is what actually disables it,
  // e.g. to leave time to solve a captcha by hand.
  const handleLoadEnd = useCallback(() => {
    log('load end');
    clearLoadingTimer();
    if (attemptTimeoutMs <= 0) return;
    loadingTimerRef.current = setTimeout(() => {
      if (hasExtractedDataRef.current) return;
      log(`timeout after ${attemptTimeoutMs}ms - no stream found`);
      // If the page saw candidates, it flushed its best one — reloading the
      // same embed will not produce anything better.
      if (
        retryOnTimeout &&
        attemptRef.current === 0 &&
        !sawCandidatesRef.current &&
        scheduleRetry('timeout')
      ) {
        onLoading?.(true);
        return;
      }
      onLoading?.(false);
      onError?.('Timed out while finding a stream.');
    }, attemptTimeoutMs);
  }, [attemptTimeoutMs, clearLoadingTimer, onError, onLoading, retryOnTimeout, scheduleRetry]);

  const handleError = useCallback(
    (event: WebViewErrorEvent) => {
      const { nativeEvent } = event;
      log('WebView error:', nativeEvent.code, nativeEvent.description);
      clearLoadingTimer();
      onLoading?.(false);
      if (scheduleRetry('load error')) {
        onLoading?.(true);
        return;
      }
      onError?.('WebView load error');
    },
    [clearLoadingTimer, onError, onLoading, scheduleRetry],
  );

  // A 403 is usually an unsolved Cloudflare challenge and a 429/5xx is
  // transient — both are worth one reload; other statuses are not. Android
  // reports HTTP errors for subresources too, so only an error on the embed
  // document itself (same origin, not a static asset, nothing found yet) is
  // treated as a failed scrape.
  const handleHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      const { statusCode, url } = event.nativeEvent;
      log('HTTP error:', statusCode, url);
      const isServerError =
        statusCode === 403 || statusCode === 429 || statusCode >= 500;
      if (!isServerError) return;
      if (hasExtractedDataRef.current || sawCandidatesRef.current) return;
      if (STATIC_ASSET_RE.test(url)) return;
      if (!sameOrigin(url, embedUrl)) {
        log('ignoring subresource HTTP error outside the embed origin');
        return;
      }
      scheduleRetry(`HTTP ${statusCode}`);
    },
    [embedUrl, scheduleRetry],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const visible = debug || !!previewStyle;
  const containerStyle = debug
    ? StyleSheet.absoluteFill
    : (previewStyle ?? styles.hidden);

  return (
    <View style={containerStyle} pointerEvents={visible ? 'auto' : 'none'}>
      <WebView
        key={webViewKey}
        source={{ uri: embedUrl }}
        // Present as a normal mobile browser so Cloudflare's JS challenge runs.
        userAgent={USER_AGENT}
        applicationNameForUserAgent="Chrome/126.0.0.0"
        injectedJavaScript={injectedJavaScript}
        // Patch fetch/XHR/<video>.src before the page's own JS runs so we
        // catch VidLink's /api/b/* JSON and the subsequent playlist request.
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
        // Inject into nested (cross-origin) iframes too - the stream request
        // originates inside the embedded player frame, not the top document.
        injectedJavaScriptForMainFrameOnly={false}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onShouldStartLoadWithRequest={(req) => {
          log('navigation:', req.url);
          // Native media loads (esp. iOS HLS) sometimes show up here
          // instead of going through the page's fetch/XHR hooks.
          extractFromUrl(req.url);
          // Popunders and app-store/intent deep links would otherwise replace
          // the embed (and the player) with an ad.
          if (isBlockedTopLevelNavigation(req.url)) {
            log('blocked navigation:', req.url);
            return false;
          }
          return true;
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Cookies must persist so the Cloudflare `cf_clearance` cookie set after
        // the challenge is reused on later requests (bypassing repeat checks).
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        // Let the interactive challenge open in the same view.
        setSupportMultipleWindows={false}
        originWhitelist={['*']}
        style={
          visible
            ? StyleSheet.absoluteFill
            : [StyleSheet.absoluteFill, styles.webviewHidden]
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Fully transparent + non-interactive, but sized like a real screen (NOT
  // 1x1 — see the class doc comment above for why that broke some servers).
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  // Android often ignores opacity on a parent View wrapping a WebView, so
  // hide the WebView itself too — otherwise ScreenScape's control bar is
  // visible during a scrape and our auto-click hits its server switcher.
  webviewHidden: {
    opacity: 0,
  },
});
