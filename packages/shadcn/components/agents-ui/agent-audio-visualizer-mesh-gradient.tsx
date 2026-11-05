'use client';

import React, { useMemo, type ComponentProps } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';
import { type AgentState, type TrackReferenceOrPlaceholder } from '@livekit/components-react';

import { ReactShaderToy } from '@/components/agents-ui/react-shader-toy';
import { useAgentAudioVisualizerMeshGradient } from '@/hooks/agents-ui/use-agent-audio-visualizer-mesh-gradient';
import { cn } from '@/lib/utils';

const MAX_COLOR_COUNT = 10;

const DEFAULT_COLORS: `#${string}`[] = ['#1FD5F9', '#2E7BF6', '#7C5CFC', '#1250C4'];

function hexToRgba(hexColor: string): [number, number, number, number] {
  try {
    const rgbaColor = hexColor.match(
      /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})?$/,
    );

    if (rgbaColor) {
      const [, r, g, b, a] = rgbaColor;
      const [red, green, blue] = [r, g, b].map((c) => parseInt(c, 16) / 255);
      const alpha = a ? parseInt(a, 16) / 255 : 1;

      return [red, green, blue, alpha];
    }
  } catch (error) {
    console.error(`Invalid hex color '${hexColor}'.\nFalling back to default color.`);
  }

  return hexToRgba(DEFAULT_COLORS[0]);
}

const shaderSource = `
const int MAX_COLOR_COUNT = ${MAX_COLOR_COUNT};

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c) * v;
}

float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec2 getPosition(int i, float t) {
  float a = float(i) * 0.37;
  float b = 0.6 + fract(float(i) / 3.0) * 0.9;
  float c = 0.8 + fract(float(i + 1) / 4.0);

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return 0.5 + 0.5 * vec2(x, y);
}

const float BASE_GRAIN_MIXER = 0.15;
const float BASE_GRAIN_OVERLAY = 0.2;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  uv -= 0.5;
  uv = rotate(uv, radians(uRotation));
  uv /= uScale;
  uv += 0.5;

  vec2 grainUV = uv * 1000.0;

  float grain = valueNoise(grainUV);
  float mixerGrain = uGrain * BASE_GRAIN_MIXER * (grain - 0.5);

  const float firstFrameOffset = 41.5;
  float t = 0.5 * (iTime * uSpeed + firstFrameOffset);

  float radius = smoothstep(0.0, 1.0, length(uv - 0.5));
  float center = 1.0 - radius;

  for (float i = 1.0; i <= 2.0; i++) {
    uv.x += uDistortion * center / i * sin(t + i * 0.4 * smoothstep(0.0, 1.0, uv.y)) * cos(0.2 * t + i * 2.4 * smoothstep(0.0, 1.0, uv.y));
    uv.y += uDistortion * center / i * cos(t + i * 2.0 * smoothstep(0.0, 1.0, uv.x));
  }

  vec2 uvRotated = uv - vec2(0.5);
  float angle = 3.0 * uSwirl * radius;
  uvRotated = rotate(uvRotated, -angle);
  uvRotated += vec2(0.5);

  vec3 color = vec3(0.0);
  float opacity = 0.0;
  float totalWeight = 0.0;

  for (int i = 0; i < MAX_COLOR_COUNT; i++) {
    if (i >= int(uColorsCount)) break;

    vec2 pos = getPosition(i, t) + mixerGrain;
    vec3 colorFraction = uColors[i].rgb * uColors[i].a;
    float opacityFraction = uColors[i].a;

    float dist = length(uvRotated - pos);
    dist = pow(dist, 3.5);
    float weight = 1.0 / (dist + 1e-3);

    color += colorFraction * weight;
    opacity += opacityFraction * weight;
    totalWeight += weight;
  }

  color /= max(1e-4, totalWeight);
  opacity /= max(1e-4, totalWeight);

  float grainOverlay = valueNoise(rotate(grainUV, 1.0) + vec2(3.0));
  grainOverlay = mix(grainOverlay, valueNoise(rotate(grainUV, 2.0) + vec2(-1.0)), 0.5);
  grainOverlay = pow(grainOverlay, 1.3);

  float grainOverlayV = grainOverlay * 2.0 - 1.0;
  vec3 grainOverlayColor = vec3(step(0.0, grainOverlayV));
  float grainOverlayStrength = uGrain * BASE_GRAIN_OVERLAY * abs(grainOverlayV);
  grainOverlayStrength = pow(grainOverlayStrength, 0.8);
  color = mix(color, grainOverlayColor, 0.35 * grainOverlayStrength);

  opacity += 0.5 * grainOverlayStrength;
  opacity = clamp(opacity, 0.0, 1.0);

  fragColor = vec4(color, opacity);
}`;

interface MeshGradientShaderProps {
  /**
   * Blob orbit speed multiplier.
   * @default 0.6
   */
  speed?: number;

  /**
   * Domain-warp distortion amount (0-1).
   * @default 0.3
   */
  distortion?: number;

  /**
   * Vortex/swirl amount (0-1).
   * @default 0.15
   */
  swirl?: number;

  /**
   * Overall zoom level of the mesh gradient. `1` is the default zoom;
   * values above `1` zoom in, values below `1` zoom out.
   * @default 1
   */
  scale?: number;

  /**
   * Rotation of the mesh gradient, in degrees.
   * @default 0
   */
  rotation?: number;

  /**
   * The palette of colors blended in the mesh gradient, in hexadecimal format.
   * @default ['#1FD5F9', '#2E7BF6', '#7C5CFC', '#1250C4']
   */
  colors?: string[];

  /**
   * Amount of grain/dither applied to the mesh gradient. `0` disables it entirely;
   * `1` is the default strength. Values above `1` intensify the effect further.
   * @default 1
   */
  grain?: number;
}

function MeshGradientShader({
  speed = 0.6,
  distortion = 0.3,
  swirl = 0.15,
  scale = 1,
  rotation = 0,
  colors = DEFAULT_COLORS,
  grain = 1,
  ref,
  className,
  ...props
}: MeshGradientShaderProps & ComponentProps<'div'>) {
  const flatColors = useMemo(() => {
    const activeColors = colors.slice(0, MAX_COLOR_COUNT);
    const flat = activeColors.flatMap(hexToRgba);
    const padding = new Array((MAX_COLOR_COUNT - activeColors.length) * 4).fill(0);

    return [...flat, ...padding];
  }, [colors]);

  return (
    <div ref={ref} className={className} {...props}>
      <ReactShaderToy
        fs={shaderSource}
        devicePixelRatio={globalThis.devicePixelRatio ?? 1}
        uniforms={{
          // Blob orbit speed multiplier
          uSpeed: { type: '1f', value: speed },
          // Domain-warp distortion amount (0-1)
          uDistortion: { type: '1f', value: distortion },
          // Vortex/swirl amount (0-1)
          uSwirl: { type: '1f', value: swirl },
          // Overall zoom level
          uScale: { type: '1f', value: scale },
          // Rotation, in degrees
          uRotation: { type: '1f', value: rotation },
          // Grain/dither strength multiplier
          uGrain: { type: '1f', value: grain },
          // Number of active colors (<= MAX_COLOR_COUNT)
          uColorsCount: { type: '1f', value: Math.min(colors.length, MAX_COLOR_COUNT) },
          // Flat RGBA array, 4 floats per color, fixed at MAX_COLOR_COUNT entries
          uColors: { type: '4fv', value: flatColors },
        }}
        onError={(error) => {
          console.error('Shader error:', error);
        }}
        onWarning={(warning) => {
          console.warn('Shader warning:', warning);
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

MeshGradientShader.displayName = 'MeshGradientShader';

export const AgentAudioVisualizerMeshGradientVariants = cva(['aspect-square'], {
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

export interface AgentAudioVisualizerMeshGradientProps {
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
   * The palette of colors blended in the mesh gradient, in hexadecimal format.
   * Accepts `#rrggbb` (alpha defaults to 1.0) or `#rrggbbaa`.
   * Up to 10 colors are supported; extras beyond 10 are ignored.
   * @defaultValue ['#1FD5F9', '#2E7BF6', '#7C5CFC', '#1250C4']
   */
  colors?: string[];
  /**
   * Amount of grain/dither applied to the mesh gradient. `0` disables it entirely;
   * `1` is the default strength. Values above `1` intensify the effect further.
   * @defaultValue 1
   */
  grain?: number;
  /**
   * Overall zoom level of the mesh gradient. `1` is the default zoom;
   * values above `1` zoom in, values below `1` zoom out.
   * @defaultValue 1
   */
  scale?: number;
  /**
   * Multiplier applied to the state/audio-driven domain-warp distortion amount.
   * `1` preserves the default reactive behavior; `0` disables distortion entirely.
   * @defaultValue 1
   */
  distortion?: number;
  /**
   * Multiplier applied to the state/audio-driven vortex/swirl amount.
   * `1` preserves the default reactive behavior; `0` disables swirl entirely.
   * @defaultValue 1
   */
  swirl?: number;
  /**
   * Rotation of the mesh gradient, in degrees.
   * @defaultValue 0
   */
  rotation?: number;
  /**
   * The audio track to visualize. Can be a local/remote audio track or a track reference.
   */
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder;
}

/**
 * An shader-based audio visualizer that responds to agent state and audio levels.
 * Displays an animated mesh gradient of blended color blobs that reacts to the current
 * agent state (connecting, thinking, speaking, etc.) and audio volume when speaking.
 *
 * @extends ComponentProps<'div'>
 *
 * @example
 * ```tsx
 * <AgentAudioVisualizerMeshGradient
 *   size="md"
 *   state="speaking"
 *   audioTrack={agentAudioTrack}
 * />
 * ```
 */
export function AgentAudioVisualizerMeshGradient({
  size = 'lg',
  state = 'connecting',
  colors = DEFAULT_COLORS,
  grain = 0,
  scale = 1,
  distortion = 1,
  swirl = 1,
  rotation = 0,
  audioTrack,
  className,
  ref,
  ...props
}: AgentAudioVisualizerMeshGradientProps &
  ComponentProps<'div'> &
  VariantProps<typeof AgentAudioVisualizerMeshGradientVariants>) {
  // const {
  //   speed,
  //   swirl: audioSwirl,
  //   distortion: audioDistortion,
  // } = useAgentAudioVisualizerMeshGradient(state, audioTrack);

  return (
    <MeshGradientShader
      ref={ref}
      data-lk-state={state}
      colors={colors}
      speed={1}
      swirl={swirl}
      grain={grain}
      scale={scale}
      distortion={distortion}
      rotation={rotation}
      className={cn(AgentAudioVisualizerMeshGradientVariants({ size }), className)}
      {...props}
    />
  );
}
