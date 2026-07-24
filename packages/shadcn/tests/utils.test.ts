import { describe, it, expect } from 'vitest';
import { normalizeVolumeBands } from '@/lib/utils';

describe('normalizeVolumeBands', () => {
  it('returns the array unchanged when the length already matches', () => {
    expect(normalizeVolumeBands([0.1, 0.2, 0.3], 3)).toEqual([0.1, 0.2, 0.3]);
  });

  it('trims excess trailing values', () => {
    expect(normalizeVolumeBands([0.1, 0.2, 0.3, 0.4], 2)).toEqual([0.1, 0.2]);
  });

  it('pads by duplicating the last value', () => {
    expect(normalizeVolumeBands([0.1, 0.2], 4)).toEqual([0.1, 0.2, 0.2, 0.2]);
  });

  it('pads a single-element array by duplicating it', () => {
    expect(normalizeVolumeBands([0.5], 3)).toEqual([0.5, 0.5, 0.5]);
  });

  it('pads an empty array with 0s', () => {
    expect(normalizeVolumeBands([], 3)).toEqual([0, 0, 0]);
  });
});
