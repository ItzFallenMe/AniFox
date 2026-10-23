/**
 * Detects the media URL a provider is actually playing.
 *
 * Providers build signed manifests at runtime, so there is nothing to resolve
 * ahead of time. This script runs inside the player page before its own code,
 * watches fetch/XHR and resource timing entries, and posts the first HLS or
 * progressive video URL back to React Native. Downloading then targets the
 * exact stream the WebView already plays.
 *
 * It is deliberately passive: no requests of its own, no DOM changes, and it
 * only reports `.m3u8` / `.mp4` URLs.
 */
export const STREAM_PROBE_SCRIPT = `
(function () {
  if (window.__anifoxStreamProbe) return;
  window.__anifoxStreamProbe = true;

  var seen = {};
  function report(url) {
    if (!url || typeof url !== 'string') return;
    if (!/\\.(m3u8|mp4)([?#]|$)/i.test(url)) return;
    if (seen[url]) return;
    seen[url] = true;
    try {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'anifox-stream', url: url })
      );
    } catch (error) {}
  }

  try {
    var originalFetch = window.fetch;
    if (originalFetch) {
      window.fetch = function (input) {
        try {
          report(typeof input === 'string' ? input : input && input.url);
        } catch (error) {}
        return originalFetch.apply(this, arguments);
      };
    }
  } catch (error) {}

  try {
    var originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      try {
        report(url);
      } catch (error) {}
      return originalOpen.apply(this, arguments);
    };
  } catch (error) {}

  try {
    setInterval(function () {
      try {
        var entries = performance.getEntriesByType('resource');
        for (var i = 0; i < entries.length; i++) report(entries[i].name);
      } catch (error) {}
    }, 2500);
  } catch (error) {}
})();
true;
`;

export interface ProbeMessage {
  type: 'anifox-stream';
  url: string;
}

/** Parse a WebView message, returning the stream URL when it is a probe hit. */
export const parseProbeMessage = (raw: string): string | null => {
  try {
    const message = JSON.parse(raw) as Partial<ProbeMessage>;
    if (message.type !== 'anifox-stream' || typeof message.url !== 'string') {
      return null;
    }
    if (!/\.(m3u8|mp4)([?#]|$)/i.test(message.url)) return null;
    return message.url;
  } catch {
    return null;
  }
};
