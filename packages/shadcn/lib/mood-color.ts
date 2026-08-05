'use client';

import { type AgentMood } from '@/hooks/agents-ui/use-expression';

/** Used on its own when there is no mood. */
export const DEFAULT_PRIMARY_COLOR = '#1FD5F9';

/**
 * Hue carries valence (warm for bright moments, cool for heavy ones) and saturation carries
 * intensity, so a recessive mood never out-shouts a strong one. These blend over your primary
 * rather than replacing it, so a visualizer still reads as yours.
 */
export const MOOD_COLORS: Record<AgentMood, `#${string}`> = {
  angry: '#F5222D',
  excited: '#FF7A45',
  happy: '#FFC53D',
  playful: '#F759AB',
  surprised: '#B37FEB',
  anxious: '#D46B08',
  hopeful: '#52C41A',
  empathetic: '#36CFC9',
  curious: '#40A9FF',
  sad: '#2F54EB',
  calm: '#8C9BAB',
};

function toRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex([r, g, b]: [number, number, number]): `#${string}` {
  // uppercase so a returned color compares equal to the MOOD_COLORS constants
  const channel = (c: number) => Math.round(c).toString(16).padStart(2, '0').toUpperCase();
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Blend two hex colors. `amount` of 0 returns `from`, 1 returns `to`. */
export function mixColors(from: string, to: string, amount: number): `#${string}` {
  const a = toRgb(from);
  const b = toRgb(to);
  const t = Math.min(Math.max(amount, 0), 1);
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}

export interface MoodColorOptions {
  /**
   * Your base color. The mood blends over it rather than replacing it, so the result still reads
   * as yours. Returned alone when there is no mood.
   *
   * @defaultValue '#1FD5F9'
   */
  primary?: `#${string}`;
  /** Override the accent for one or more moods. */
  moodColors?: Partial<Record<AgentMood, `#${string}`>>;
  /**
   * How far to blend toward the mood accent, 0 to 1. `0` ignores mood entirely; `1` replaces
   * `primary` with the mood color.
   *
   * @defaultValue 0.75
   */
  blend?: number;
}

/**
 * The color for a mood. Not a hook, so it also works for static swatches and legends.
 *
 * @example
 *
 * ```ts
 * moodColor('excited', { primary: '#7C4DFF' });
 * ```
 */
export function moodColor(mood: AgentMood | null, options: MoodColorOptions = {}): `#${string}` {
  const primary = options.primary ?? DEFAULT_PRIMARY_COLOR;
  if (!mood) {
    return primary;
  }
  return mixColors(primary, options.moodColors?.[mood] ?? MOOD_COLORS[mood], options.blend ?? 0.75);
}
