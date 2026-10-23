import { compareVersions, normalizeVersion } from '../src/services/updates';

describe('update versions', () => {
  it('strips the tag prefix and pre-release suffix', () => {
    expect(normalizeVersion('v2.1.0')).toBe('2.1.0');
    expect(normalizeVersion('v2.1.0-beta.1')).toBe('2.1.0');
  });

  it('compares numerically, not lexically', () => {
    expect(compareVersions('2.10.0', '2.9.0')).toBe(1);
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0);
    expect(compareVersions('v1.9.9', '2.0.0')).toBe(-1);
    expect(compareVersions('2.0', '2.0.0')).toBe(0);
  });
});
