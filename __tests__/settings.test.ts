import { DEFAULT_SETTINGS, glassPreset } from '../src/config/settings';

describe('app settings defaults', () => {
  it('opens with the liquid glass bar on and autoplay enabled', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      liquidGlass: true,
      glassIntensity: 'regular',
      frostedBlur: true,
      defaultServerId: null,
      autoPlay: true,
      autoRotate: true,
      discordPresence: false,
    });
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
