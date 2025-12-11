'use client';

import React, { forwardRef } from 'react';
import { ReactShader } from '../react-shader/react-shader';

const shaderSource = `
const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// Hash function for pseudo-random numbers
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

// 2D hash
float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Smooth noise function
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // Smoothstep
  
  float a = hash2(i);
  float b = hash2(i + vec2(1.0, 0.0));
  float c = hash2(i + vec2(0.0, 1.0));
  float d = hash2(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion for more complex noise
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for(int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

// Luma for alpha calculation
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// RGB to HSL conversion
vec3 rgb2hsl(vec3 c) {
  float maxC = max(max(c.r, c.g), c.b);
  float minC = min(min(c.r, c.g), c.b);
  float l = (maxC + minC) * 0.5;
  
  if(maxC == minC) {
    return vec3(0.0, 0.0, l); // achromatic
  }
  
  float d = maxC - minC;
  float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
  
  float h;
  if(maxC == c.r) {
    h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  } else if(maxC == c.g) {
    h = (c.b - c.r) / d + 2.0;
  } else {
    h = (c.r - c.g) / d + 4.0;
  }
  h /= 6.0;
  
  return vec3(h, s, l);
}

// Helper for HSL to RGB
float hue2rgb(float p, float q, float t) {
  if(t < 0.0) t += 1.0;
  if(t > 1.0) t -= 1.0;
  if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if(t < 1.0/2.0) return q;
  if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

// HSL to RGB conversion
vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x;
  float s = hsl.y;
  float l = hsl.z;
  
  if(s == 0.0) {
    return vec3(l); // achromatic
  }
  
  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;
  
  float r = hue2rgb(p, q, h + 1.0/3.0);
  float g = hue2rgb(p, q, h);
  float b = hue2rgb(p, q, h - 1.0/3.0);
  
  return vec3(r, g, b);
}

// Create radial fiber pattern with noise distortion
float irisPattern(vec2 uv, float radius, float time) {
  // Convert to polar coordinates
  float angle = atan(uv.y, uv.x);
  float dist = length(uv);
  
  // Normalize distance relative to iris
  float normalizedDist = dist / radius;
  
  // Number of primary fibers (lower = more spacing)
  float numFibers = 20.0 * uFrequency;
  
  // Add noise to the angle for organic fiber distortion
  float angleNoise = fbm(vec2(angle * 8.0, dist * 15.0 + time * 0.3 )) * 0.15 * uAmplitude;
  float distortedAngle = angle + angleNoise;
  
  // Create primary radial fibers with varying density
  float fiberAngle = distortedAngle * numFibers;
  float fiber = abs(sin(fiberAngle));
  
  // Add secondary finer fibers (less dense)
  float fineFibers = abs(sin(distortedAngle * numFibers * 1.5 + dist * 2.0));
  fiber = mix(fiber, fineFibers, 0.9);
  
  // Modulate fiber intensity based on radial position
  // Fibers are more visible in the middle of the iris
  float radialFade = smoothstep(0.0, 0.3, normalizedDist) * smoothstep(1.0, 0.6, normalizedDist);
  fiber *= radialFade;
  
  // Add depth variation - some fibers appear deeper/lighter
  float depthNoise = fbm(vec2(angle * 12.0, dist * 8.0));
  fiber *= 0.6 + depthNoise * 0.8;
  
  // Add crypts (darker spots/holes in the iris)
  float crypts = fbm(vec2(angle * 6.0 + time * 0.02, dist * 10.0));
  crypts = smoothstep(0.4, 0.6, crypts) * 0.4;
  fiber -= crypts * radialFade;
  
  return clamp(fiber, 0.0, 1.0);
}

// Create the collarette (the wavy ring that divides the iris)
float collarette(vec2 uv, float innerRadius, float time) {
  float angle = atan(uv.y, uv.x);
  float dist = length(uv);
  
  // Wavy collarette line
  float waveNoise = fbm(vec2(angle * 5.0, time * 0.1 * uSpeed)) * 0.05 * uAmplitude;
  float collaretteRadius = (innerRadius + 0.05 + waveNoise) * uScale;
  
  float collaretteLine = 1.0 - smoothstep(0.0, 0.05 * uBlur, abs(dist - collaretteRadius));
  
  return collaretteLine * 0.3;
}

// Create limbal ring (dark ring at the edge of the iris)
float limbalRing(float dist, float irisRadius) {
  float ringStart = irisRadius - 0.04;
  float ringIntensity = smoothstep(ringStart, irisRadius, dist);
  return ringIntensity * 0.6;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec2 center = vec2(0.5, 0.5);
  vec2 pos = uv - center;
  
  // Correct for aspect ratio
  float aspect = iResolution.x / iResolution.y;
  pos.x *= aspect;
  
  float time = iTime;
  
  // Define iris and pupil dimensions
  float irisRadius = 0.5;
  float pupilRadius = irisRadius * uScale;
  float dist = length(pos);
  
  // Initialize color
  vec3 finalColor = vec3(0.0);
  float alpha = 0.0;
  
  // Check if we're within the iris (extend for edge fade)
  float fadeExtent = 0.15;
  if(dist < irisRadius + fadeExtent) {
    // Base iris color (deep blue with variation)
    vec3 baseColor = uColor;
    
    // Create color variation across the iris
    float colorNoise = fbm(vec2(atan(pos.y, pos.x) * 4.0, dist * 12.0));
    
    // Lighter color for highlights
    vec3 lightColor = baseColor;
    
    // Darker color for shadows/depth - shift hue using HSL
    vec3 darkColorBase = baseColor * 0.3;
    vec3 darkHSL = rgb2hsl(darkColorBase);
    // Shift hue based on colorShift (0-1 maps to 0-0.5 hue rotation)
    darkHSL.x = fract(darkHSL.x + uColorShift);
    vec3 darkColor = hsl2rgb(darkHSL);
    
    // Mix colors based on noise for natural variation
    vec3 irisColor = mix(darkColor, lightColor, colorNoise);
    
    // Add the fiber pattern
    float fibers = irisPattern(pos, irisRadius, time);
    irisColor = mix(irisColor, lightColor * 1.2, fibers * 0.95);
    
    // Add collarette
    float coll = collarette(pos, pupilRadius, time);
    irisColor = mix(irisColor, darkColor * 0.9, coll);
    
    // Add limbal ring (darker edge)
    float limbal = limbalRing(dist, irisRadius);
    irisColor = mix(irisColor, darkColor * 0.3, limbal);
    
    // Pupil
    float pupilEdge = smoothstep(pupilRadius - 0.01 * uBlur, pupilRadius + 0.005 * uBlur, dist);
    irisColor = mix(vec3(0.02, 0.01, 0.01), irisColor, pupilEdge);
    

    
    // Fade out at outer edge of iris
    float fadeWidth = 0.08 * uBlur;
    float edgeFade = 1.0 - smoothstep(irisRadius - fadeWidth, irisRadius + fadeWidth, dist);
    
    finalColor = irisColor * uMix;
    alpha = edgeFade * uMix;
  }
  
  // Handle theme mode
  if(uMode > 0.5) {
    // Light mode - adjust for light backgrounds
    finalColor = mix(finalColor, vec3(1.0) - finalColor * 0.5, 0.1);
  }
  
  // Premultiplied alpha for proper blending
  fragColor = vec4(finalColor * alpha, alpha);
}
`;

export interface OrbShaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Aurora wave speed
   * @default 1.0
   */
  speed?: number;

  /**
   * Turbulence amplitude
   * @default 0.5
   */
  amplitude?: number;

  /**
   * Wave frequency and complexity
   * @default 0.5
   */
  frequency?: number;

  /**
   * Shape scale
   * @default 0.3
   */
  scale?: number;

  /**
   * Shape type: 1=circle, 2=line
   * @default 1
   */
  shape?: number;

  /**
   * Edge blur/softness
   * @default 1.0
   */
  blur?: number;

  /**
   * RGB color
   * @default [0.0, 0.0, 1.0]
   */
  rgbColor?: [number, number, number];

  /**
   * Color variation across layers (0-1)
   * Controls how much colors change between iterations
   * @default 0.5
   * @example 0.0 - minimal color variation (more uniform)
   * @example 0.5 - moderate variation (default)
   * @example 1.0 - maximum variation (rainbow effect)
   */
  colorShift?: number;

  /**
   * Brightness of the aurora (0-1)
   * @default 1.0
   */
  brightness?: number;

  /**
   * Display mode for different backgrounds
   * - 'dark': Optimized for dark backgrounds (default)
   * - 'light': Optimized for light/white backgrounds (inverts colors)
   * @default 'dark'
   */
  themeMode?: 'dark' | 'light';
}

export const OrbShader = forwardRef<HTMLDivElement, OrbShaderProps>(
  (
    {
      className,
      shape = 1.0,
      speed = 1.0,
      amplitude = 0.5,
      frequency = 0.5,
      scale = 0.2,
      blur = 1.0,
      rgbColor = [0.12156862745098039, 0.8352941176470589, 0.9764705882352941], // LiveKit Blue,
      colorShift = 1.0,
      brightness = 1.0,
      themeMode = typeof window !== 'undefined' &&
      document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light',
      ...props
    },
    ref,
  ) => {
    const globalThis = typeof window !== 'undefined' ? window : global;
    return (
      <div ref={ref} className={className} {...props}>
        <ReactShader
          fs={shaderSource}
          devicePixelRatio={globalThis.devicePixelRatio ?? 1}
          uniforms={{
            // Aurora wave speed
            uSpeed: { type: '1f', value: speed },
            // Edge blur/softness
            uBlur: { type: '1f', value: blur },
            // Shape scale
            uScale: { type: '1f', value: scale },
            // Shape type: 1=circle, 2=line
            uShape: { type: '1f', value: shape },
            // Wave frequency and complexity
            uFrequency: { type: '1f', value: frequency },
            // Turbulence amplitude
            uAmplitude: { type: '1f', value: amplitude },
            // Light intensity (bloom)
            uBloom: { type: '1f', value: 0.0 },
            // Brightness of the aurora (0-1)
            // uMix: { type: '1f', value: brightness },
            uMix: { type: '1f', value: 1.0 },
            // Color variation across layers (0-1)
            uSpacing: { type: '1f', value: 0.5 },
            // Color palette offset - shifts colors along the gradient (0-1)
            uColorShift: { type: '1f', value: colorShift },
            // Color variation across layers (0-1)
            uVariance: { type: '1f', value: 0.1 },
            // Smoothing of the aurora (0-1)
            uSmoothing: { type: '1f', value: 1.0 },
            // Display mode: 0=dark background, 1=light background
            uMode: { type: '1f', value: themeMode === 'light' ? 1.0 : 0.0 },
            // Color
            uColor: { type: '3fv', value: rgbColor ?? [0, 0.7, 1] },
          }}
          onError={(error) => {
            console.error('Shader error:', error);
          }}
          onWarning={(warning) => {
            console.warn('Shader warning:', warning);
          }}
          style={{ width: '100%', height: '100%' } as CSSStyleDeclaration}
        />
      </div>
    );
  },
);

OrbShader.displayName = 'OrbShader';

export default OrbShader;
