/**
 * Runs the injected scraper script in a minimal DOM harness so the candidate
 * ranking (the part that decides *which* URL plays) is exercised, not just
 * parsed.
 */
/* eslint-disable no-new-func -- the harness executes the injected page script */
jest.mock('react-native-webview', () => ({ WebView: () => null }));

import { buildInjectedJavaScript } from '../src/components/WebViewScraper';

interface FakeResponse {
  url: string;
  body?: string;
  contentType?: string;
}

interface Harness {
  messages: Array<Record<string, unknown>>;
  fetch: (url: string) => Promise<unknown>;
  runTimers: () => void;
  document: { cookie: string };
  videos: () => Array<Record<string, unknown>>;
}

const flushMicrotasks = async () => {
  for (let i = 0; i < 5; i += 1) {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
};

const createHarness = (responses: FakeResponse[]): Harness => {
  const messages: Array<Record<string, unknown>> = [];
  const timers = new Map<number, () => void>();
  let timerId = 0;

  const location = {
    href: 'https://vidfast.pro/tv/456/2/7',
    hostname: 'vidfast.pro',
    replace() {},
  };

  const navigator = Object.create({});
  navigator.languages = ['en-US', 'en'];
  navigator.hardwareConcurrency = 8;
  navigator.deviceMemory = 8;

  const documentStub = {
    documentElement: {},
    head: { appendChild() {} },
    body: {},
    cookie: '',
    baseURI: location.href,
    querySelectorAll: () => [],
    createElement: () => ({ textContent: '' }),
    elementFromPoint: () => null,
  };

  class FakeXHR {}
  (FakeXHR.prototype as unknown as { open: () => void }).open = () => {};

  class FakeMutationObserver {
    observe() {}
    disconnect() {}
  }

  let index = 0;
  const fakeTimeout = (fn: () => void) => {
    const id = (timerId += 1);
    timers.set(id, fn);
    return id;
  };
  const fakeClear = (id: number) => {
    timers.delete(id);
  };
  const sandbox: Record<string, unknown> = {
    document: documentStub,
    navigator,
    location,
    XMLHttpRequest: FakeXHR,
    MutationObserver: FakeMutationObserver,
    performance: { getEntriesByType: () => [] },
    URL,
    setTimeout: fakeTimeout,
    clearTimeout: fakeClear,
    setInterval: fakeTimeout,
    clearInterval: fakeClear,
    fetch: () => {
      const response = responses[index];
      index += 1;
      if (!response) return Promise.reject(new Error('no fake response left'));
      return Promise.resolve({
        url: response.url,
        headers: { get: () => response.contentType ?? '' },
        clone: () => ({
          text: () => Promise.resolve(response.body ?? ''),
        }),
      });
    },
    ReactNativeWebView: {
      postMessage: (payload: string) => messages.push(JSON.parse(payload)),
    },
  };
  sandbox.window = sandbox;

  // `new Function` gives the script its own scope; each page global the script
  // touches is passed in explicitly, mirroring the WebView document.
  const run = new Function(
    'window',
    'document',
    'navigator',
    'location',
    'XMLHttpRequest',
    'MutationObserver',
    'performance',
    'URL',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    buildInjectedJavaScript(30000, false, true),
  ) as (...args: unknown[]) => void;

  run(
    sandbox,
    documentStub,
    navigator,
    location,
    FakeXHR,
    FakeMutationObserver,
    sandbox.performance,
    URL,
    fakeTimeout,
    fakeClear,
    fakeTimeout,
    fakeClear,
  );

  return {
    messages,
    fetch: (url: string) => {
      const expected = responses[index]?.url;
      if (!expected) throw new Error(`no fake response for ${url}`);
      if (expected !== url) {
        throw new Error(`expected ${expected} but the scraper fetched ${url}`);
      }
      return (sandbox.fetch as (input: string) => Promise<unknown>)(url);
    },
    runTimers: () => {
      // One-shot settle timer plus the 1s harvest interval; both are safe to
      // run once here.
      for (const fn of [...timers.values()]) fn();
    },
    document: documentStub,
    videos: () =>
      messages.filter(message => message.type === 'video') as Array<
        Record<string, unknown>
      >,
  };
};

describe('injected scraper runtime', () => {
  it('does not commit an ad that loads before the real manifest', async () => {
    const harness = createHarness([
      { url: 'https://ads.adsterra.com/preroll.mp4' },
      { url: 'https://cdn.example.com/media/film.mp4' },
    ]);

    await harness.fetch('https://ads.adsterra.com/preroll.mp4');
    await flushMicrotasks();
    expect(harness.videos()).toHaveLength(0);

    await harness.fetch('https://cdn.example.com/media/film.mp4');
    await flushMicrotasks();
    expect(harness.videos()).toHaveLength(0);

    // Weak field: after the settle window the best candidate wins anyway.
    harness.runTimers();
    await flushMicrotasks();
    const [video] = harness.videos();
    expect(video?.responseURL).toBe('https://cdn.example.com/media/film.mp4');
    expect(video?.format).toBe('mp4');
  });

  it('never flushes an ad-only page', async () => {
    const harness = createHarness([
      { url: 'https://ads.adsterra.com/preroll.mp4' },
    ]);

    await harness.fetch('https://ads.adsterra.com/preroll.mp4');
    await flushMicrotasks();
    harness.runTimers();
    await flushMicrotasks();

    expect(harness.videos()).toHaveLength(0);
  });

  it('prefers a master HLS playlist over an earlier MP4', async () => {
    const harness = createHarness([
      { url: 'https://cdn.example.com/media/film.mp4' },
      {
        url: 'https://cdn.example.com/api/stream/456',
        contentType: 'application/json',
        body: JSON.stringify({
          stream: { playlist: 'https://cdn.example.com/hls/master.m3u8' },
        }),
      },
    ]);

    await harness.fetch('https://cdn.example.com/media/film.mp4');
    await flushMicrotasks();
    expect(harness.videos()).toHaveLength(0);

    await harness.fetch('https://cdn.example.com/api/stream/456');
    await flushMicrotasks();

    const videos = harness.videos();
    expect(videos).toHaveLength(1);
    expect(videos[0].responseURL).toBe(
      'https://cdn.example.com/hls/master.m3u8',
    );
    expect(videos[0].format).toBe('hls');
    expect(videos[0].pageUrl).toBe('https://vidfast.pro/tv/456/2/7');
  });

  it('reports same-site cookies but never leaks them cross-site', async () => {
    const harness = createHarness([
      {
        url: 'https://vidfast.pro/hls/index.m3u8',
        body: '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nlow.m3u8',
      },
      { url: 'https://cdn.example.net/hls/index.m3u8', body: '#EXTM3U' },
    ]);
    harness.document.cookie = 'cf_clearance=abc123; theme=dark';

    await harness.fetch('https://vidfast.pro/hls/index.m3u8');
    await flushMicrotasks();
    expect(harness.videos()[0].cookies).toBe('cf_clearance=abc123; theme=dark');

    const crossSite = createHarness([
      { url: 'https://cdn.example.net/hls/index.m3u8', body: '#EXTM3U' },
    ]);
    crossSite.document.cookie = 'cf_clearance=abc123';

    await crossSite.fetch('https://cdn.example.net/hls/index.m3u8');
    await flushMicrotasks();
    expect(crossSite.videos()[0].cookies).toBe('');
  });
});
