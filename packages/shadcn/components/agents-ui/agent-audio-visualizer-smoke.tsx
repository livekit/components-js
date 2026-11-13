'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';
import { type AgentState, type TrackReferenceOrPlaceholder } from '@livekit/components-react';

import { ReactShaderToy } from '@/components/agents-ui/react-shader-toy';
import { useAgentAudioVisualizerSmoke } from '@/hooks/agents-ui/use-agent-audio-visualizer-smoke';
import { cn } from '@/lib/utils';

const DEFAULT_COLOR = '#2CEAED';

/**
 * Upper bound for the pixel ratio the Smoke shader renders at.
 *
 * The shader raymarches a volume: up to 40 steps per pixel, and each occupied step evaluates about
 * 15 gradient-noise calls (the cloud density plus one self-shadow tap). Fragment cost grows
 * quadratically with the pixel ratio. The smoke has no hard edges, so the canvas renders below
 * 1x and CSS scales it up: 0.75 draws about 44% fewer pixels than 1x for a slightly softer image.
 */
const MAX_SHADER_PIXEL_RATIO = 0.75;

/** Field-time units per second at speed 1. */
const TIME_RATE = 0.5;

const TAU = Math.PI * 2;

/**
 * Rigid rotation of the whole vortex, in radians per field-time unit per unit of swirl. 0.7 keeps
 * the overall rotation speed of the exported shader, which used 0.3 plus a radius-dependent term
 * that averaged about 0.4.
 */
const RIGID_SPIN_RATE = 0.7;

/**
 * Breathing shear: inner radii swing ahead of the rim and back again. The exported shader let this
 * shear grow with time, which wound the noise into rings too fine to render (streaks and grain
 * after a few minutes). Here it stays bounded: the amplitude matches the winding the exported
 * shader reached at field time 2.
 */
const SHEAR_AMPLITUDE = 2;
/** Angular frequency of the breathing shear, in radians per field-time unit. */
const SHEAR_FREQUENCY = 0.5;

/**
 * Largest frame delta (in seconds) added to the field time. Stops the smoke from jumping forward
 * when a background tab becomes visible again.
 */
const MAX_FRAME_DELTA = 0.1;

/** Lit and shadow colors of the smoke for each theme. */
const THEME_PALETTES = {
  dark: { lit: '#F7F8F8', shadow: '#000000' },
  light: { lit: '#C9D0D4', shadow: '#1E262C' },
} as const;

/** Exported look of the smoke. These stay constant across agent states. */
const SWIRL = -3.36;
const SOFTNESS = 0.51;
const DETAIL = 1.5;
const CAMERA_DIRECTION = [0.9762, 0.0295, 0.2148];
const CAMERA_UP = [-0.0288, 0.9996, -0.0063];

function srgbToLinear(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Converts a `#RRGGBB` color to linear RGB, which is what the shader expects. */
function hexToLinearRgb(hexColor: string): number[] {
  const rgbColor = hexColor.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);

  if (rgbColor) {
    const [, r, g, b] = rgbColor;
    return [r, g, b].map((c = '00') => srgbToLinear(parseInt(c, 16) / 255));
  }

  console.error(
    `Invalid hex color '${hexColor}'.\nFalling back to default color '${DEFAULT_COLOR}'.`,
  );
  return hexToLinearRgb(DEFAULT_COLOR);
}

const shaderSource = `
// Smoke ball: volumetric raymarch of a swirling cloud inside a unit sphere.
// Output is premultiplied sRGB over transparent.

// Quality and cost: steps per ray through the ball.
const int MAX_STEPS = 40;
const vec3 LIGHT_DIR = vec3(0.7558, 0.6047, 0.2519);
const float CAMERA_DISTANCE = 4.0;
const float TAN_HALF_FOV = 0.27;

// Sine-free hash (Dave Hoskins, hash33) in [-1, 1]. A sin()-based hash loses accuracy for large
// inputs on some GPUs, which shows up as grain in long sessions.
vec3 hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return -1.0 + 2.0 * fract((p.xxy + p.yxx) * p.zyx);
}

// Gradient noise in about [-1, 1].
float gradientNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(
      mix(dot(hash3(i), f), dot(hash3(i + vec3(1, 0, 0)), f - vec3(1, 0, 0)), u.x),
      mix(dot(hash3(i + vec3(0, 1, 0)), f - vec3(0, 1, 0)), dot(hash3(i + vec3(1, 1, 0)), f - vec3(1, 1, 0)), u.x),
      u.y
    ),
    mix(
      mix(dot(hash3(i + vec3(0, 0, 1)), f - vec3(0, 0, 1)), dot(hash3(i + vec3(1, 0, 1)), f - vec3(1, 0, 1)), u.x),
      mix(dot(hash3(i + vec3(0, 1, 1)), f - vec3(0, 1, 1)), dot(hash3(i + vec3(1, 1, 1)), f - vec3(1, 1, 1)), u.x),
      u.y
    ),
    u.z
  );
}

// GLSL ES 1.00 needs a constant loop bound, so loop to the largest octave count and break early.
float fbm(vec3 p, int octaves) {
  float amplitude = 1.0;
  float total = 0.0;
  float weight = 0.0;
  for (int i = 0; i < 3; i++) {
    if (i >= octaves) break;
    total += amplitude * gradientNoise(p);
    weight += amplitude;
    amplitude *= 0.5;
    p *= 2.0;
  }
  return total / weight;
}

// Density noise in about [0, 1]. One unit of p spans four base cells.
float densityNoise(vec3 p) {
  return 0.5 + 0.85 * fbm(p * 4.0, 3);
}

// Three decorrelated fields that push the sample point around.
vec3 warpNoise(vec3 p) {
  vec3 q = p * 4.0;
  return 0.85 * vec3(
    fbm(q + vec3(17.3, 0.0, 0.0), 2),
    fbm(q + vec3(0.0, 31.7, 0.0), 2),
    fbm(q + vec3(0.0, 0.0, 47.1), 2)
  );
}

mat2 rotate(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

// Rotates p by the vortex. The static twist turns inner radii further than outer ones, which gives
// the spiral shape. uSpin turns the whole vortex at one rate. uShear swings back and forth, so inner
// radii lead and then lag the rim without the noise ever winding up. Both are computed on the CPU.
vec3 swirlPoint(vec3 p) {
  float r = length(p.xz);
  float twist = uSwirl * (1.1 / (0.35 + r) + 0.4 * p.y);
  float spin = uSpin + uShear * 0.35 / (0.45 + r);
  vec3 q = p;
  q.xz = rotate(twist + spin) * q.xz;
  return q;
}

vec3 flowAt(float t) {
  return vec3(0.0, -t * 0.22, 0.0);
}

// Displacement field for a swirled point q at field time t.
vec3 warpAt(vec3 q, float t) {
  return warpNoise(q * 0.21 * uDetail + flowAt(t) * 0.5 + vec3(0.0, 0.0, t * 0.05));
}

// Raw cloud value for a swirled point q, displaced by warp. fine adds the small billows.
float cloudAt(vec3 q, vec3 warp, float t, bool fine) {
  vec3 flow = flowAt(t);
  q += warp * 1.1 * uTurbulence;
  float n = densityNoise(q * 0.3 * uDetail + flow);
  if (fine) {
    float detail = densityNoise(q * 0.9 * uDetail + flow * 2.3 + vec3(t * 0.08, 0.0, 0.0)) - 0.5;
    // Wisps lean on the small billows, so the strands get ragged edges.
    n += detail * (0.35 + 0.35 * uTurbulence + 0.5 * uWisp);
  }
  return n;
}

// Turns a cloud value into density inside the unit ball.
float shape(vec3 p, float n) {
  float d = length(p);
  float feather = mix(0.2, 0.9, uSoftness);
  float edge = 1.0 - smoothstep(1.0 - feather, 1.0, d);
  // uWisp (0-1) sharpens the noise and raises the threshold, so only thin strands survive.
  float body = (n - 0.5) * 3.0 * (1.0 + uWisp);
  // Noise erodes the rim strongly and the core weakly, so the mass stays round. As uWisp rises,
  // the core erodes as strongly as the rim, so the ball breaks up into wisps.
  float erosion = mix(0.9, mix(0.45, 0.9, uWisp), edge);
  float v = edge * 1.15 - 0.35 - uWisp * 0.9 + body * erosion;
  return clamp(v * 1.6, 0.0, 1.0) * smoothstep(0.0, 0.08, 1.0 - d);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  float aspect = iResolution.x / iResolution.y;
  vec2 ndc = (uv * 2.0 - 1.0) * vec2(max(aspect, 1.0), max(1.0 / aspect, 1.0));
  // uScale shrinks the ball: 1.0 is the full framing.
  ndc /= max(uScale, 0.001);
  vec3 direction = normalize(uCameraDirection);
  vec3 camPos = direction * CAMERA_DISTANCE;
  vec3 forward = -direction;
  vec3 right = normalize(cross(forward, uCameraUp));
  vec3 up = cross(right, forward);
  vec3 rd = normalize(forward + (ndc.x * right + ndc.y * up) * TAN_HALF_FOV);
  float b = dot(camPos, rd);
  float c = dot(camPos, camPos) - 1.0;
  float h = b * b - c;
  if (h <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }
  h = sqrt(h);
  float t0 = -b - h;
  float span = 2.0 * h;
  int steps = int(ceil(float(MAX_STEPS) * span * 0.5));
  float dt = span / float(steps);
  // Interleaved-gradient step offset, shifted by the golden ratio every frame, so the sampling
  // pattern moves instead of showing as a fixed dotted texture. mod() keeps the float small.
  float ign = fract(52.9829189 * fract(dot(fragCoord, vec2(0.06711056, 0.00583715))));
  float jitter = fract(ign + mod(float(iFrame), 64.0) * 0.61803399);
  // uFieldTime is accumulated on the CPU (speed x elapsed time), so speed changes never make the
  // pattern jump.
  float t = uFieldTime;

  vec3 acc = vec3(0.0);
  float transmittance = 1.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= steps) break;
    vec3 p = camPos + rd * (t0 + (float(i) + jitter) * dt);
    vec3 q = swirlPoint(p);
    vec3 warp = warpAt(q, t);
    float d = shape(p, cloudAt(q, warp, t, true));
    if (d > 0.002) {
      // Self-shadowing: one density tap toward the light plus the analytic
      // depth of the ball behind this sample along the light direction. The tap reuses this
      // sample's warp: the warp field is smooth, and it saves 6 noise calls per step.
      vec3 pl = p + LIGHT_DIR * 0.25;
      float along = dot(p, LIGHT_DIR);
      float toSurface = -along + sqrt(max(along * along - dot(p, p) + 1.0, 0.0));
      float occlusion = shape(pl, cloudAt(swirlPoint(pl), warp, t, false)) * 1.6 + toSurface * 2.1;
      float shade = mix(exp(-occlusion * uDensity), 1.0, 0.05);
      float core = exp(-dot(p, p) * 4.0);
      vec3 color = mix(uShadow, uLit, shade) + uGlowColor * uGlow * core * 1.4;
      float alpha = 1.0 - exp(-d * uDensity * dt * 6.0);
      acc += transmittance * alpha * color;
      transmittance *= 1.0 - alpha;
      if (transmittance < 0.01) break;
    }
  }

  float coverage = 1.0 - transmittance;
  vec3 color = coverage > 0.0 ? acc / coverage : vec3(0.0);
  color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / 2.2));
  color += (jitter - 0.5) / 255.0;
  fragColor = vec4(clamp(color, 0.0, 1.0) * coverage, coverage);
}`;

interface SmokeShaderProps {
  /**
   * Flow rate of the smoke. Field time advances by `speed` times elapsed time.
   * @default 0.16
   */
  speed?: number;

  /**
   * Size of the ball (0-1). 1 fills the canvas.
   * @default 0.8
   */
  scale?: number;

  /**
   * Disturbance of the smoke (0-2).
   * @default 0
   */
  turbulence?: number;

  /**
   * Opacity of the volume (0.2-2).
   * @default 1.2
   */
  density?: number;

  /**
   * Strength of the core glow (0-1).
   * @default 1.0
   */
  glow?: number;

  /**
   * How far the ball breaks up into thin strands (0-1). 0 is a full ball, 1 is only wisps.
   * @default 0
   */
  wisp?: number;

  /**
   * Color of the core glow in hexidecimal format.
   * @default '#2CEAED'
   */
  color?: `#${string}`;

  /**
   * Display mode for different backgrounds
   * - 'dark': Optimized for dark backgrounds
   * - 'light': Optimized for light/white backgrounds
   *
   * When omitted, follows the `dark` class on `<html>`.
   */
  themeMode?: 'dark' | 'light';
}

function subscribeToDocumentTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getDocumentThemeMode() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerThemeMode() {
  return 'light' as const;
}

/**
 * Follows the `dark` class on `<html>` (the shadcn/ui convention), so Smoke updates when the page
 * theme changes. The server snapshot is `'light'`.
 */
function useDocumentThemeMode() {
  return useSyncExternalStore(subscribeToDocumentTheme, getDocumentThemeMode, getServerThemeMode);
}

/**
 * Drives the smoke's motion from the CPU, so a change in speed changes how fast the smoke flows
 * without moving it. Computing `iTime * speed` in the shader would make the pattern jump on every
 * change.
 *
 * - `fieldTime` accumulates speed x elapsed time. It drives the flow and warp.
 * - `spin` is the rigid rotation of the vortex, wrapped to one turn so the shader never takes the
 *   cosine of a large angle.
 * - `shear` swings back and forth with field time, so the vortex never winds up.
 *
 * Returns stable uniform objects. ReactShaderToy reads their `value` every frame, so updating them
 * does not need a React render.
 */
function useFlowUniforms(speed: number) {
  const [uniforms] = useState(() => ({
    fieldTime: { type: '1f', value: 0 },
    spin: { type: '1f', value: 0 },
    shear: { type: '1f', value: 0 },
  }));
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let frameId = 0;
    let lastTimestamp: number | undefined;

    const tick = (timestamp: number) => {
      if (lastTimestamp !== undefined) {
        const delta = Math.min((timestamp - lastTimestamp) / 1000, MAX_FRAME_DELTA);
        const step = delta * speedRef.current * TIME_RATE;
        uniforms.fieldTime.value += step;
        uniforms.spin.value = (uniforms.spin.value + step * SWIRL * RIGID_SPIN_RATE) % TAU;
        uniforms.shear.value =
          SWIRL * SHEAR_AMPLITUDE * Math.sin(uniforms.fieldTime.value * SHEAR_FREQUENCY);
      }
      lastTimestamp = timestamp;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [uniforms]);

  return uniforms;
}

function SmokeShader({
  speed = 0.16,
  scale = 0.8,
  turbulence = 0,
  density = 1.2,
  glow = 1.0,
  wisp = 0,
  color = DEFAULT_COLOR,
  themeMode: themeModeProp,
  ref,
  className,
  ...props
}: SmokeShaderProps & ComponentProps<'div'>) {
  const documentThemeMode = useDocumentThemeMode();
  // Callers can pass an unchecked value (for example a theme library's resolved theme cast to this
  // type), so anything other than 'light' falls back to dark, as in Aura.
  const themeMode = (themeModeProp ?? documentThemeMode) === 'light' ? 'light' : 'dark';
  const flow = useFlowUniforms(speed);
  const glowColor = useMemo(() => hexToLinearRgb(color), [color]);
  const palette = useMemo(() => {
    const { lit, shadow } = THEME_PALETTES[themeMode];
    return { lit: hexToLinearRgb(lit), shadow: hexToLinearRgb(shadow) };
  }, [themeMode]);
  const devicePixelRatio = Math.min(globalThis.devicePixelRatio ?? 1, MAX_SHADER_PIXEL_RATIO);

  return (
    <div ref={ref} className={className} {...props}>
      <ReactShaderToy
        fs={shaderSource}
        devicePixelRatio={devicePixelRatio}
        uniforms={{
          // Field time, spin, and shear, advanced every frame by useFlowUniforms
          uFieldTime: flow.fieldTime,
          uSpin: flow.spin,
          uShear: flow.shear,
          // Size of the ball: 1 fills the canvas
          uScale: { type: '1f', value: scale },
          // Vortex strength; the sign sets the direction
          uSwirl: { type: '1f', value: SWIRL },
          // Disturbance of the smoke
          uTurbulence: { type: '1f', value: turbulence },
          // Opacity of the volume
          uDensity: { type: '1f', value: density },
          // Edge feather
          uSoftness: { type: '1f', value: SOFTNESS },
          // Billow size
          uDetail: { type: '1f', value: DETAIL },
          // Core glow strength
          uGlow: { type: '1f', value: glow },
          // Break-up into thin strands
          uWisp: { type: '1f', value: wisp },
          // Linear RGB colors
          uLit: { type: '3fv', value: palette.lit },
          uShadow: { type: '3fv', value: palette.shadow },
          uGlowColor: { type: '3fv', value: glowColor },
          // Camera orientation
          uCameraDirection: { type: '3fv', value: CAMERA_DIRECTION },
          uCameraUp: { type: '3fv', value: CAMERA_UP },
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

SmokeShader.displayName = 'SmokeShader';

export const AgentAudioVisualizerSmokeVariants = cva(['aspect-square'], {
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

export interface AgentAudioVisualizerSmokeProps {
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
   * The color of the core glow in hexidecimal format.
   * @defaultValue '#2CEAED'
   */
  color?: `#${string}`;
  /**
   * The theme mode of the smoke. When omitted, follows the `dark` class on `<html>` and updates
   * when it changes. Pass it explicitly if your app marks dark mode another way.
   */
  themeMode?: 'dark' | 'light';
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
 * A shader-based audio visualizer that responds to agent state and audio levels.
 * Displays a ball of swirling smoke with a glowing core that reacts to the current agent state
 * (connecting, thinking, speaking, etc.) and audio volume when speaking.
 *
 * @extends ComponentProps<'div'>
 *
 * @example
 * ```tsx
 * <AgentAudioVisualizerSmoke
 *   size="md"
 *   state="speaking"
 *   audioTrack={agentAudioTrack}
 * />
 * ```
 */
export function AgentAudioVisualizerSmoke({
  size = 'lg',
  state = 'connecting',
  color = DEFAULT_COLOR,
  audioTrack,
  volume,
  themeMode,
  className,
  ref,
  ...props
}: AgentAudioVisualizerSmokeProps &
  ComponentProps<'div'> &
  VariantProps<typeof AgentAudioVisualizerSmokeVariants>) {
  const { speed, scale, turbulence, density, glow, wisp } = useAgentAudioVisualizerSmoke(
    state,
    audioTrack,
    volume,
  );

  return (
    <SmokeShader
      ref={ref}
      data-lk-state={state}
      color={color}
      speed={speed}
      scale={scale}
      turbulence={turbulence}
      density={density}
      glow={glow}
      wisp={wisp}
      themeMode={themeMode}
      className={cn(AgentAudioVisualizerSmokeVariants({ size }), className)}
      {...props}
    />
  );
}
