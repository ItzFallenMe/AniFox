/**
 * Ad-free playback guards for the embed player.
 *
 * Embed providers are third-party pages, so ad-free means three things:
 * popunders never open a window, redirects out of the player are refused, and
 * in-page ad frames/overlays are stripped before they render.
 */

/** Hosts that only exist to serve ads, trackers or popunders. */
const AD_HOSTS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'propellerpops.com',
  'adsterra.com',
  'exoclick.com',
  'exosrv.com',
  'juicyads.com',
  'trafficjunky.com',
  'clickadu.com',
  'hilltopads.net',
  'onclickads.net',
  'adnxs.com',
  'taboola.com',
  'outbrain.com',
  'revcontent.com',
  'mgid.com',
  'zedo.com',
  'adcash.com',
  'adspyglass.com',
  'tsyndicate.com',
  'bongacams.com',
  'media.net',
  'pushame.com',
  'srv-ad.com',
  '1xbet.com',
];

/** Schemes that only ever come from ad redirects on mobile pages. */
const BLOCKED_SCHEMES = [
  'intent:',
  'market:',
  'whatsapp:',
  'telegram:',
  'tg:',
  'mailto:',
  'tel:',
  'sms:',
  'itms-apps:',
  'vnd.youtube:',
];

const hostOf = (value: string): string => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    // Relative URLs and about:blank fall through as their own host.
    return '';
  }
};

/** `a.b.example.com` → `example.com`; IPs and localhost stay as-is. */
export const registrableHost = (host: string): string => {
  const trimmed = host.toLowerCase().replace(/^\.+/, '');
  if (!trimmed || trimmed.includes(':') || /^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
    return trimmed;
  }
  const parts = trimmed.split('.');
  return parts.length <= 2 ? trimmed : parts.slice(-2).join('.');
};

/** True when the URL points at a known ad/tracker host (or a subdomain of one). */
export const isAdHost = (url: string): boolean => {
  const host = hostOf(url);
  if (!host) return false;
  return AD_HOSTS.some(
    ad => host === ad || host.endsWith(`.${ad}`) || registrableHost(host) === ad,
  );
};

/** True for app-store/popup schemes that embeds use to escape the player. */
export const isBlockedScheme = (url: string): boolean => {
  const lowered = url.trim().toLowerCase();
  return BLOCKED_SCHEMES.some(scheme => lowered.startsWith(scheme));
};

export const isHttpUrl = (url: string): boolean => /^https?:\/\//i.test(url);

/**
 * Navigation policy: keep the player's own site (and its subdomains), refuse
 * ad hosts, app-store schemes and any attempt to take the top frame elsewhere.
 */
export const shouldBlockNavigation = (
  url: string,
  playerUrl: string,
  isTopFrame: boolean,
): boolean => {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed === 'about:blank' || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return false;
  }
  if (isBlockedScheme(trimmed)) return true;
  if (!isHttpUrl(trimmed)) return false;
  if (isAdHost(trimmed)) return true;

  if (!isTopFrame) return false;

  const playerHost = registrableHost(hostOf(playerUrl));
  const targetHost = registrableHost(hostOf(trimmed));
  if (!playerHost || !targetHost) return false;
  // Same site (including subdomains) and the YouTube trailer are fine.
  if (targetHost === playerHost) return false;
  if (targetHost === 'youtube.com' || targetHost === 'youtu.be') return false;
  return true;
};

/**
 * Injected before page scripts run:
 * - `window.open` and friends become no-ops (no popunders),
 * - alert/confirm/prompt can't trap the player,
 * - links can't force a new tab,
 * - ad iframes are removed as the DOM mutates.
 */
export const AD_BLOCK_SCRIPT = `(function () {
  try {
    var noop = function () { return null; };
    window.open = noop;
    window.alert = function () {};
    window.confirm = function () { return false; };
    window.prompt = function () { return null; };
    window.onbeforeunload = null;
    window.addEventListener('beforeunload', function (event) { event.stopImmediatePropagation(); }, true);

    var AD_HOSTS = ${JSON.stringify(AD_HOSTS)};

    function isAd(src) {
      if (!src) return false;
      try {
        var host = new URL(src, window.location.href).hostname.toLowerCase();
        return AD_HOSTS.some(function (ad) {
          return host === ad || host.indexOf('.' + ad) > -1;
        });
      } catch (error) { return false; }
    }

    function scrub() {
      var frames = document.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i += 1) {
        if (isAd(frames[i].src)) frames[i].remove();
      }
      var links = document.querySelectorAll('a[target="_blank"]');
      for (var j = 0; j < links.length; j += 1) {
        links[j].removeAttribute('target');
      }
      var style = document.getElementById('anifox-ad-guard');
      if (!style) {
        style = document.createElement('style');
        style.id = 'anifox-ad-guard';
        style.textContent = [
          'ins.adsbygoogle, .adsbygoogle, [id^="ad-"], [class*="ad-overlay"]',
          ', [class*="popunder"], [id*="popunder"], [class*="advertisement"]',
          ', [id*="advertisement"] { display: none !important; }',
          'html, body { overscroll-behavior: none; }',
        ].join('');
        (document.head || document.documentElement).appendChild(style);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scrub, { once: true });
    } else {
      scrub();
    }

    try {
      new MutationObserver(scrub).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    } catch (error) {}
  } catch (error) {}
})();`;
