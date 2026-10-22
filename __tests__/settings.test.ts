import {
  DEFAULT_SETTINGS,
  PLAYBACK_RATES,
  glassPreset,
} from '../src/config/settings';

describe('app settings defaults', () => {
  it('opens with the liquid glass bar on and normal speed', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      liquidGlass: true,
      glassIntensity: 'regular',
      frostedBlur: true,
      defaultServerId: null,
      defaultPlaybackRate: 1,
      autoPlay: true,
    });
  });

  it('offers the player speeds the UI renders', () => {
    expect([...PLAYBACK_RATES]).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2]);
  });
});

describe('glassPreset', () => {
  it('increases blur with stronger glass', () => {
    expect(glassPreset('soft').blurAmount).toBeLessThan(
      glassPreset('regular').blurAmount,
    );
    expect(glassPreset('regular').blurAmount).toBeLessThan(
      glassPreset('strong').blurAmount,
    );
  });

  it('keeps the tint readable for every intensity', () => {
    for (const intensity of ['soft', 'regular', 'strong'] as const) {
      const preset = glassPreset(intensity);
      expect(preset.overlayColor).toMatch(/^rgba\(8,8,8,0\.\d+\)$/);
    }
  });
});
