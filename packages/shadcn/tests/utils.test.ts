import { describe, it, expect } from 'vitest';
import { resolveVolumeFromBands } from '@/lib/utils';

describe('resolveVolumeFromBands', () => {
  it('averages multiple values', () => {
    expect(resolveVolumeFromBands([0.2, 0.6])).toBeCloseTo(0.4);
    expect(resolveVolumeFromBands([1, 0, 0.5])).toBeCloseTo(0.5);
  });

  it('returns the value directly when there is exactly one element', () => {
    expect(resolveVolumeFromBands([0.9])).toBe(0.9);
  });

  it('returns 0 for an empty array', () => {
    expect(resolveVolumeFromBands([])).toBe(0);
  });
});
