'use client';

import { useEffect, useState } from 'react';

const TICK_MS = 16;
const FRAME_CYCLE = 240;
const MIN_V = 0.4;
const MAX_V = 1.0;
const RANGE = MAX_V - MIN_V;
const ATTACK = 0.6;
const DECAY = 0.1;
const BELL_FLOOR = 0.1;
const SPEECH_TICKS = [90, 200];
const PAUSE_TICKS = [18, 55];
const NOTIFY_EVERY = 2;
const RHYTHM_BEATS = 12;
const PHI = 1.618033988749;

type VolumeListener = (volumes: number[]) => void;

let frameIndex = 0;
let interval: ReturnType<typeof setInterval> | undefined;
let speechScale = 1;
let speechTicksLeft = 120;
let speechSeed = 12345;

const listenersByBarCount = new Map<number, Set<VolumeListener>>();
const volumesByBarCount = new Map<number, number[]>();
const cache = new Map<
  number,
  { phases: number[]; baselines: number[]; variation: number[]; bell: number[] }
>();

function nextDuration(isPause: boolean): number {
  speechSeed = (speechSeed * 1103515245 + 12345) >>> 0;
  const [min, max] = (isPause ? PAUSE_TICKS : SPEECH_TICKS) as [number, number];
  return min + (speechSeed % (max - min + 1));
}

function getBarConfig(barCount: number) {
  let c = cache.get(barCount);
  if (c) return c;
  const n = barCount;
  const last = Math.max(1, n - 1);
  const phases = Array.from({ length: n }, (_, i) => (i * 2.1 + n * 0.7) * Math.PI);
  const baselines = Array.from({ length: n }, (_, i) => 0.08 + 0.25 * ((i * PHI) % 1));
  const variation =
    n <= 1
      ? [1]
      : Array.from({ length: n }, (_, i) => 0.25 + 0.75 * (1 - Math.sin((Math.PI * i) / last)));
  const bell = Array.from({ length: n }, (_, i) => {
    const x = i / last;
    return BELL_FLOOR + (1 - BELL_FLOOR) * Math.pow(Math.sin(Math.PI * x), 1.5);
  });
  c = { phases, baselines, variation, bell };
  cache.set(barCount, c);
  return c;
}

function generateVolumes(barCount: number, prev: number[]): number[] {
  const t = frameIndex / FRAME_CYCLE;
  const phaseBase = t * Math.PI * 2;
  const { phases, baselines, variation, bell } = getBarConfig(barCount);
  let rhythm = 1;
  if (speechScale > 0.5) {
    const beat = t * RHYTHM_BEATS * Math.PI * 2;
    const wobble = 0.52 * Math.sin(t * 5 * Math.PI * 2);
    const swing = 0.8 * Math.sin(beat * 1.31);
    const wave = Math.max(-1, Math.min(1, Math.sin(beat + wobble) + swing));
    rhythm = 0.6 + 0.4 * (0.5 + 0.5 * wave);
  }

  return Array.from({ length: barCount }, (_, i) => {
    const phase = phaseBase + (phases[i] ?? 0);
    const h =
      0.45 +
      0.3 * Math.sin(phase * 1.7) +
      0.2 * Math.sin(phase * 3.2) +
      0.12 * Math.sin(phase * 5.1) +
      (baselines[i] ?? 0.2);
    const sharp = Math.pow(Math.min(1, Math.max(0, h)), 0.5);
    const activity = 0.5 + (sharp - 0.5) * (variation[i] ?? 1);
    const target = (MIN_V + activity * RANGE * (bell[i] ?? 1)) * speechScale * rhythm;
    const p = prev[i] ?? 0;
    const f = target > p ? ATTACK : DECAY;
    return p + (target - p) * f;
  });
}

function tick() {
  frameIndex = (frameIndex + 1) % FRAME_CYCLE;

  if (--speechTicksLeft <= 0) {
    const toPause = speechScale > 0.5;
    speechScale = toPause ? 0 : 1;
    speechTicksLeft = nextDuration(toPause);
  }

  const notify = frameIndex % NOTIFY_EVERY === 0;
  for (const [barCount, listeners] of listenersByBarCount.entries()) {
    if (listeners.size === 0) continue;
    const next = generateVolumes(barCount, volumesByBarCount.get(barCount) ?? []);
    volumesByBarCount.set(barCount, next);
    if (notify) for (const fn of listeners) fn(next);
  }
}

function subscribe(barCount: number, listener: VolumeListener): () => void {
  const set = listenersByBarCount.get(barCount) ?? new Set<VolumeListener>();
  set.add(listener);
  listenersByBarCount.set(barCount, set);

  const existing = volumesByBarCount.get(barCount);
  if (existing) listener(existing);
  else {
    const init = generateVolumes(barCount, []);
    volumesByBarCount.set(barCount, init);
    listener(init);
  }

  if (!interval) interval = setInterval(tick, TICK_MS);

  return () => {
    const s = listenersByBarCount.get(barCount);
    if (!s) return;
    s.delete(listener);
    if (s.size === 0) listenersByBarCount.delete(barCount);
    const hasAny = [...listenersByBarCount.values()].some((set) => set.size > 0);
    if (!hasAny && interval) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

export function useSimulatedVolumeBands(barCount: number) {
  const [volumes, setVolumes] = useState<number[]>([]);
  useEffect(() => subscribe(barCount, setVolumes), [barCount]);
  return volumes;
}
