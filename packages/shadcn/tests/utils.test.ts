import { describe, it, expect } from 'vitest';
import { normalizeVolumeBands, resolveVolumeFromBands } from '@/lib/utils';

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
