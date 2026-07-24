import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a single volume value from an array of per-band volume values.
 * Averages all values, except when the array contains exactly one element,
 * in which case that value is returned directly.
 */
export function resolveVolumeFromBands(bands: number[]): number {
  if (bands.length === 0) return 0;
  if (bands.length === 1) return bands[0];
  return bands.reduce((sum, value) => sum + value, 0) / bands.length;
}

/**
 * Resizes an array of per-band volume values to exactly `count` entries.
 * Excess values are trimmed from the end; if there are too few, the last
 * value is duplicated to fill the remainder. An empty array is padded with 0s.
 */
export function normalizeVolumeBands(bands: number[], count: number): number[] {
  if (bands.length === count) return bands;
  if (bands.length > count) return bands.slice(0, count);
  const lastValue = bands[bands.length - 1] ?? 0;
  return [...bands, ...new Array(count - bands.length).fill(lastValue)];
}
