/* eslint-disable no-new-func -- validating the injected script requires parsing it */
jest.mock('react-native-webview', () => ({ WebView: () => null }));

import { buildInjectedJavaScript } from '../src/components/WebViewScraper';

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
});
