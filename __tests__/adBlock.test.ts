import { parse } from '@babel/parser';

import {
  AD_BLOCK_SCRIPT,
  isAdHost,
  isBlockedScheme,
  isHttpUrl,
  registrableHost,
  shouldBlockNavigation,
} from '../src/utils/adBlock';

const PLAYER = 'https://vidlink.pro/tv/95479/1/3';

describe('ad hosts', () => {
  it('flags ad and tracker domains including subdomains', () => {
    expect(isAdHost('https://doubleclick.net/ad.js')).toBe(true);
    expect(isAdHost('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')).toBe(
      true,
    );
    expect(isAdHost('https://cdn.popads.net/pop.js')).toBe(true);
  });

  it('does not flag the player or a video CDN', () => {
    expect(isAdHost(PLAYER)).toBe(false);
    expect(isAdHost('https://cdn.vidlink.pro/hls/master.m3u8')).toBe(false);
    expect(isAdHost('https://image.tmdb.org/t/p/w500/x.jpg')).toBe(false);
  });
});

describe('schemes', () => {
  it('blocks app-store and messaging popups', () => {
    expect(isBlockedScheme('intent://open#Intent;package=com.ad;end')).toBe(true);
    expect(isBlockedScheme('market://details?id=com.ad')).toBe(true);
    expect(isBlockedScheme('whatsapp://send?text=x')).toBe(true);
    expect(isBlockedScheme('tel:+123')).toBe(true);
  });

  it('allows http(s) and about:blank', () => {
    expect(isBlockedScheme(PLAYER)).toBe(false);
    expect(isBlockedScheme('about:blank')).toBe(false);
    expect(isHttpUrl(PLAYER)).toBe(true);
  });
});

describe('navigation guard', () => {
  it('allows the player page, its subdomains and the video CDN', () => {
    expect(shouldBlockNavigation(PLAYER, PLAYER, true)).toBe(false);
    expect(
      shouldBlockNavigation('https://vidlink.pro/embed/95479/1/3?x=1', PLAYER, true),
    ).toBe(false);
    expect(
      shouldBlockNavigation('https://cdn.vidlink.pro/stream.m3u8', PLAYER, false),
    ).toBe(false);
    expect(shouldBlockNavigation('about:blank', PLAYER, true)).toBe(false);
    expect(shouldBlockNavigation('blob:https://vidlink.pro/abc', PLAYER, true)).toBe(false);
  });

  it('blocks ad hosts, popup schemes and cross-site takeovers', () => {
    expect(shouldBlockNavigation('https://popads.net/pop', PLAYER, false)).toBe(true);
    expect(shouldBlockNavigation('intent://x', PLAYER, false)).toBe(true);
    expect(
      shouldBlockNavigation('https://win-a-phone.example.com/', PLAYER, true),
    ).toBe(true);
  });

  it('leaves cross-site subframes alone so embedded players still work', () => {
    expect(
      shouldBlockNavigation('https://player.example.net/embed', PLAYER, false),
    ).toBe(false);
  });

  it('allows YouTube for trailers', () => {
    expect(
      shouldBlockNavigation(
        'https://www.youtube.com/embed/abc',
        'https://www.youtube.com/embed/abc',
        true,
      ),
    ).toBe(false);
  });

  it('normalises hosts to their registrable domain', () => {
    expect(registrableHost('cdn.vidlink.pro')).toBe('vidlink.pro');
    expect(registrableHost('vidlink.pro')).toBe('vidlink.pro');
    expect(registrableHost('localhost')).toBe('localhost');
    expect(registrableHost('127.0.0.1')).toBe('127.0.0.1');
  });
});

describe('injected guard script', () => {
  it('neutralises popups and strips ad frames', () => {
    expect(AD_BLOCK_SCRIPT).toContain('window.open = noop');
    expect(AD_BLOCK_SCRIPT).toContain('MutationObserver');
    expect(AD_BLOCK_SCRIPT).toContain('doubleclick.net');
    expect(AD_BLOCK_SCRIPT).toContain('remove');
  });

  it('is valid JavaScript, so it cannot fail silently on device', () => {
    expect(() => parse(AD_BLOCK_SCRIPT, { sourceType: 'script' })).not.toThrow();
  });
});
