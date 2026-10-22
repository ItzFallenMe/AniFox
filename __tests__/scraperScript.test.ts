/* eslint-disable no-new-func -- validating the injected script requires parsing it */
jest.mock('react-native-webview', () => ({ WebView: () => null }));

import {
  buildInjectedJavaScript,
  isBlockedTopLevelNavigation,
} from '../src/components/WebViewScraper';

describe('buildInjectedJavaScript', () => {
  it('produces valid JavaScript for the WebView', () => {
    const script = buildInjectedJavaScript(30000, true, true);

    expect(script).toContain('__anifoxStreamFound');
    expect(script).toContain('CENTER_CLICK_TIMEOUT_MS = 30000');
    expect(script).toContain('MUTE_MEDIA = true');
    expect(script).toContain('AUTO_TAP = true');
    expect(() => new Function(script)).not.toThrow();
  });

  it('honours a disabled timeout and auto tap', () => {
    const script = buildInjectedJavaScript(0, false, false);

    expect(script).toContain('CENTER_CLICK_TIMEOUT_MS = 0');
    expect(script).toContain('AUTO_TAP = false');
    expect(() => new Function(script)).not.toThrow();
  });

  it('ranks candidates instead of committing the first URL it sees', () => {
    const script = buildInjectedJavaScript(30000, true, true);

    expect(script).toContain('addCandidate');
    expect(script).toContain('COMMIT_SCORE');
    expect(script).toContain('flushCandidates');
    // A candidate message tells native whether anything was found at all,
    // which decides whether a timeout is worth retrying.
    expect(script).toContain("post({ type: 'candidate' })");
    // The stream is reported with the document that produced it plus its
    // same-site cookies, so playback can send a matching Referer.
    expect(script).toContain('pageUrl: location.href');
    expect(script).toContain('cookies: cookiesFor(entry.url)');
  });

  it('covers common automation signals and play overlays', () => {
    const script = buildInjectedJavaScript(30000, true, true);

    expect(script).toContain("defineNav('webdriver', false)");
    expect(script).toContain('__anifoxNativeName');
    expect(script).toContain('.shaka-play-button');
    expect(script).toContain('forEachDocument');
  });
});

describe('isBlockedTopLevelNavigation', () => {
  it('blocks ad networks, intent and deep links', () => {
    expect(
      isBlockedTopLevelNavigation('https://ads.doubleclick.net/jump/123'),
    ).toBe(true);
    expect(
      isBlockedTopLevelNavigation('https://www.popads.net/popunder'),
    ).toBe(true);
    expect(
      isBlockedTopLevelNavigation('intent://scan/#Intent;scheme=zxing;end'),
    ).toBe(true);
    expect(isBlockedTopLevelNavigation('market://details?id=com.ad')).toBe(
      true,
    );
  });

  it('allows normal embed and media navigations', () => {
    expect(
      isBlockedTopLevelNavigation('https://vidfast.pro/movie/123'),
    ).toBe(false);
    expect(
      isBlockedTopLevelNavigation(
        'https://cdn.example.com/hls/abc/index.m3u8?token=1',
      ),
    ).toBe(false);
    expect(isBlockedTopLevelNavigation('about:blank')).toBe(false);
  });
});
