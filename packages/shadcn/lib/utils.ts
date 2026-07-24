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
