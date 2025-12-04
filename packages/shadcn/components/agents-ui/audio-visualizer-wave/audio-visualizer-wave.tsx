'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import {
  type AnimationPlaybackControlsWithThen,
  type ValueAnimationTransition,
  animate,
  useMotionValue,
  useMotionValueEvent,
} from 'motion/react';
import {
  type AgentState,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
  // useMultibandTrackVolume,
  useTrackVolume,
} from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { WaveShader, type WaveShaderProps } from './shader';

const DEFAULT_SPEED = 5;
const DEFAULT_AMPLITUDE = 0.025;
const DEFAULT_FREQUENCY = 10;
const DEFAULT_TRANSITION: ValueAnimationTransition = { duration: 0.2, ease: 'easeOut' };

function useAnimatedValue<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const motionValue = useMotionValue(initialValue);
  const controlsRef = useRef<AnimationPlaybackControlsWithThen | null>(null);
  useMotionValueEvent(motionValue, 'change', (value) => setValue(value as T));

  const animateFn = useCallback(
    (targetValue: T | T[], transition: ValueAnimationTransition) => {
      controlsRef.current = animate(motionValue, targetValue, transition);
    },
    [motionValue],
  );

  return { value, controls: controlsRef, animate: animateFn };
}

export const AudioVisualizerWaveVariants = cva(['aspect-square'], {
  variants: {
    size: {
      icon: 'h-[24px] gap-[2px]',
      sm: 'h-[56px] gap-[4px]',
      md: 'h-[112px] gap-[8px]',
      lg: 'h-[224px] gap-[16px]',
      xl: 'h-[448px] gap-[32px]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface AudioVisualizerWaveProps {
  state?: AgentState;
  audioTrack: TrackReferenceOrPlaceholder;
  className?: string;
}

export function AudioVisualizerWave({
  size = 'lg',
  state = 'speaking',
  color,
  lineWidth,
  smoothing,
  audioTrack,
  className,
}: AudioVisualizerWaveProps & WaveShaderProps & VariantProps<typeof AudioVisualizerWaveVariants>) {
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const { value: amplitude, animate: animateAmplitude } = useAnimatedValue(DEFAULT_AMPLITUDE);
  const { value: frequency, animate: animateFrequency } = useAnimatedValue(DEFAULT_FREQUENCY);
  const { value: opacity, animate: animateOpacity } = useAnimatedValue(1.0);

  const _lineWidth = useMemo(() => {
    if (lineWidth) {
      return lineWidth;
    }
    switch (size) {
      case 'icon':
      case 'sm':
        return 2;
      default:
        return 1;
    }
  }, [lineWidth, size]);

  const volume = useTrackVolume(audioTrack as TrackReference, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });

  useEffect(() => {
    switch (state) {
      case 'disconnected':
        setSpeed(DEFAULT_SPEED);
        animateAmplitude(0, DEFAULT_TRANSITION);
        animateFrequency(0, DEFAULT_TRANSITION);
        animateOpacity(1.0, DEFAULT_TRANSITION);
        return;
      case 'listening':
        setSpeed(DEFAULT_SPEED);
        animateAmplitude(DEFAULT_AMPLITUDE, DEFAULT_TRANSITION);
        animateFrequency(DEFAULT_FREQUENCY, DEFAULT_TRANSITION);
        animateOpacity([1.0, 0.3], {
          duration: 0.75,
          repeat: Infinity,
          repeatType: 'mirror',
        });
        return;
      case 'thinking':
      case 'connecting':
      case 'initializing':
        setSpeed(DEFAULT_SPEED * 4);
        animateAmplitude(DEFAULT_AMPLITUDE / 4, DEFAULT_TRANSITION);
        animateFrequency(DEFAULT_FREQUENCY * 4, DEFAULT_TRANSITION);
        animateOpacity([1.0, 0.3], {
          duration: 0.4,
          repeat: Infinity,
          repeatType: 'mirror',
        });
        return;
      case 'speaking':
      default:
        setSpeed(DEFAULT_SPEED * 2);
        animateAmplitude(DEFAULT_AMPLITUDE, DEFAULT_TRANSITION);
        animateFrequency(DEFAULT_FREQUENCY, DEFAULT_TRANSITION);
        animateOpacity(1.0, DEFAULT_TRANSITION);
        return;
    }
  }, [state, setSpeed, animateAmplitude, animateFrequency, animateOpacity]);

  useEffect(() => {
    if (state === 'speaking' && volume > 0) {
      animateAmplitude(0.015 + 0.4 * volume, { duration: 0 });
      animateFrequency(20 + 60 * volume, { duration: 0 });
    }
  }, [state, volume, animateAmplitude, animateFrequency]);

  return (
    <WaveShader
      speed={speed}
      color={color}
      amplitude={amplitude}
      frequency={frequency}
      lineWidth={_lineWidth}
      smoothing={smoothing}
      style={{ opacity }}
      className={cn(
        AudioVisualizerWaveVariants({ size }),
        'mask-[linear-gradient(90deg,transparent_0%,black_20%,black_80%,transparent_100%)]',
        'overflow-hidden rounded-full',
        className,
      )}
    />
  );
}
