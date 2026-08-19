'use client';

import { type ComponentProps, useCallback, useEffect, useRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';
import { type AgentState, type TrackReferenceOrPlaceholder } from '@livekit/components-react';

import {
  ORBIT_BAND_COUNT,
  useAgentAudioVisualizerOrbit,
} from '@/hooks/agents-ui/use-agent-audio-visualizer-orbit';
import { cn } from '@/lib/utils';

const DEFAULT_COLOR = '#1FD5F9';

function hexToRgb(hexColor: string): [number, number, number] {
  const value = parseInt(hexColor.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHsl([r0, g0, b0]: [number, number, number]): [number, number, number] {
  const r = r0 / 255;
  const g = g0 / 255;
  const b = b0 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

interface OrbitBlob {
  speed: number;
  phase: number;
  dist: number;
  size: number;
  hueShift: number;
  band: number;
}

function createBlobs(count: number): OrbitBlob[] {
  return Array.from({ length: count }, (_, i) => ({
    speed: (0.3 + 0.13 * i) * (i % 2 ? 1 : -1),
    phase: (i * Math.PI * 2) / count,
    dist: 0.16 + 0.07 * (i % 3),
    size: 0.3 + 0.06 * (i % 4),
    hueShift: (i - 3) * 9,
    band: i,
  }));
}

interface OrbitDrawParams {
  level: number;
  bands: number[];
  connected: boolean;
  swirl: number;
  breatheFrequency: number;
  targetRgb: [number, number, number];
}

/**
 * A cluster of soft orbs orbiting a hot core, drawn additively on a 2D canvas.
 * Orbit speed follows `swirl`/`breatheFrequency` (thinking swirls, listening breathes)
 * and per-band audio energy pushes the orbs outward and brightens the core.
 */
class Orbit {
  private readonly ctx: CanvasRenderingContext2D | null;
  private size = 0;
  private rgb: [number, number, number];
  private energy = 0;
  private spin = 0;
  private bandLevels: number[];
  private readonly blobs: OrbitBlob[];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    initialRgb: [number, number, number],
  ) {
    this.ctx = canvas.getContext('2d');
    this.rgb = initialRgb;
    this.bandLevels = new Array(ORBIT_BAND_COUNT).fill(0);
    this.blobs = createBlobs(ORBIT_BAND_COUNT);
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const size = this.canvas.clientWidth;
    if (size === 0) return;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.size = size;
  }

  private orb(
    x: number,
    y: number,
    radius: number,
    h: number,
    s: number,
    l: number,
    alpha: number,
  ) {
    const ctx = this.ctx;
    if (!ctx) return;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${alpha})`);
    gradient.addColorStop(0.55, `hsla(${h}, ${s}%, ${l * 0.8}%, ${alpha * 0.4})`);
    gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l * 0.7}%, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  draw(now: number, params: OrbitDrawParams) {
    const { ctx, size } = this;
    if (!ctx || !size) return;
    const { level, bands, connected, swirl, breatheFrequency, targetRgb } = params;

    const t = now / 1000;
    const center = size / 2;

    // ease color and energy so changes wash in instead of snapping
    this.rgb = this.rgb.map((c, i) => c + (targetRgb[i] - c) * 0.08) as [number, number, number];
    this.energy += (level - this.energy) * 0.25;
    this.bandLevels = this.bandLevels.map((value, i) => value + ((bands[i] ?? 0) - value) * 0.3);

    const [h, s, l] = rgbToHsl(this.rgb);
    const sat = s * 100;
    this.spin += swirl * 0.016;

    const breathe = connected ? 1 + Math.sin(t * breatheFrequency) * 0.025 : 0.8;
    const scale = size * 0.5 * breathe * (connected ? 1 : 0.75);
    const dim = connected ? 1 : 0.3;

    ctx.clearRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'lighter';

    // orbiting orbs, pushed outward and brightened by their frequency band
    for (const blob of this.blobs) {
      const energy = this.bandLevels[blob.band % this.bandLevels.length] * 0.7 + this.energy * 0.3;
      const angle = blob.phase + this.spin * blob.speed;
      const dist = scale * (blob.dist + energy * 0.34);
      const wobble = Math.sin(t * 1.7 + blob.phase * 3) * scale * 0.03;
      const x = center + Math.cos(angle) * (dist + wobble);
      const y = center + Math.sin(angle) * (dist + wobble);
      const radius = scale * (blob.size + energy * 0.25);
      this.orb(
        x,
        y,
        radius,
        h + blob.hueShift,
        Math.min(100, sat),
        l * 100,
        (0.34 + energy * 0.3) * dim,
      );
    }

    // hot core
    const coreL = Math.min(88, l * 100 + 18 + this.energy * 30);
    this.orb(center, center, scale * (0.4 + this.energy * 0.12), h, sat * 0.9, coreL, 0.75 * dim);

    // halo ring that flares with speech
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `hsla(${h}, ${sat}%, ${Math.min(90, l * 100 + 20)}%, ${(0.1 + this.energy * 0.35) * dim})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center, center, scale * (0.72 + this.energy * 0.2), 0, Math.PI * 2);
    ctx.stroke();
  }
}

export const AgentAudioVisualizerOrbitVariants = cva(['aspect-square'], {
  variants: {
    size: {
      icon: 'h-[24px]',
      sm: 'h-[56px]',
      md: 'h-[112px]',
      lg: 'h-[224px]',
      xl: 'h-[448px]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface AgentAudioVisualizerOrbitProps {
  /**
   * The size of the visualizer.
   * @defaultValue 'lg'
   */
  size?: 'icon' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Agent state
   * @default 'connecting'
   */
  state?: AgentState;
  /**
   * The color of the orbit in hexadecimal format.
   * @defaultValue '#1FD5F9'
   */
  color?: `#${string}`;
  /**
   * The audio track to visualize. Can be a local/remote audio track or a track reference.
   */
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder;
  /**
   * Volume value (0-1) to use instead of the value computed from the audioTrack.
   */
  volume?: number;
}

/**
 * A canvas-based audio visualizer that responds to agent state and audio levels.
 * Displays a cluster of orbs orbiting a hot core, drawn with additive blending
 * on a dark background.
 *
 * @extends ComponentProps<'canvas'>
 *
 * @example
 * ```tsx
 * <AgentAudioVisualizerOrbit
 *   size="md"
 *   state="speaking"
 *   audioTrack={agentAudioTrack}
 * />
 * ```
 */
export function AgentAudioVisualizerOrbit({
  size = 'lg',
  state = 'connecting',
  color = DEFAULT_COLOR,
  audioTrack,
  volume,
  className,
  ref,
  ...props
}: AgentAudioVisualizerOrbitProps &
  ComponentProps<'canvas'> &
  VariantProps<typeof AgentAudioVisualizerOrbitVariants>) {
  const { level, bands, connected, swirl, breatheFrequency } = useAgentAudioVisualizerOrbit(
    state,
    audioTrack,
    volume,
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbitRef = useRef<Orbit | null>(null);
  const paramsRef = useRef<OrbitDrawParams>({
    level,
    bands,
    connected,
    swirl,
    breatheFrequency,
    targetRgb: hexToRgb(color),
  });
  paramsRef.current = {
    level,
    bands,
    connected,
    swirl,
    breatheFrequency,
    targetRgb: hexToRgb(color),
  };

  const setCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const orbit = new Orbit(canvas, paramsRef.current.targetRgb);
    orbitRef.current = orbit;

    const resizeObserver = new ResizeObserver(() => orbit.resize());
    resizeObserver.observe(canvas);

    let animationFrameId = requestAnimationFrame(function tick(now) {
      orbit.draw(now, paramsRef.current);
      animationFrameId = requestAnimationFrame(tick);
    });

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      orbitRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={setCanvasRef}
      data-lk-state={state}
      className={cn(AgentAudioVisualizerOrbitVariants({ size }), className)}
      {...props}
    />
  );
}

AgentAudioVisualizerOrbit.displayName = 'AgentAudioVisualizerOrbit';
