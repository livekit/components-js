import { useEffect, useRef, useState, useCallback } from 'react';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';
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
  useTrackVolume,
} from '@livekit/components-react';

const DEFAULT_SPEED = 0.08;
const DEFAULT_SCALE = 0.8;
const DEFAULT_TURBULENCE = 0.35;
const DEFAULT_DENSITY = 0.2;
const DEFAULT_GLOW = 0;
const DEFAULT_WISP = 1;
const DEFAULT_TRANSITION: ValueAnimationTransition = { duration: 0.5, ease: 'easeOut' };
const DEFAULT_PULSE_TRANSITION: ValueAnimationTransition = {
  duration: 0.35,
  ease: 'easeOut',
  repeat: Infinity,
  repeatType: 'mirror',
};

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

  return { value, motionValue, controls: controlsRef, animate: animateFn };
}

export function useAgentAudioVisualizerSmoke(
  state: AgentState | undefined,
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder,
  volumeProp?: number,
) {
  const { value: speed, animate: animateSpeed } = useAnimatedValue(DEFAULT_SPEED);
  const {
    value: scale,
    animate: animateScale,
    motionValue: scaleMotionValue,
  } = useAnimatedValue(DEFAULT_SCALE);
  const { value: turbulence, animate: animateTurbulence } = useAnimatedValue(DEFAULT_TURBULENCE);
  const { value: density, animate: animateDensity } = useAnimatedValue(DEFAULT_DENSITY);
  const { value: glow, animate: animateGlow } = useAnimatedValue(DEFAULT_GLOW);
  const { value: wisp, animate: animateWisp } = useAnimatedValue(DEFAULT_WISP);

  const trackVolume = useTrackVolume(audioTrack as TrackReference, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });
  const volume = volumeProp ?? trackVolume;

  useEffect(() => {
    switch (state) {
      case 'idle':
      case 'failed':
      case 'disconnected':
        animateSpeed(0.08, DEFAULT_TRANSITION);
        animateScale(0.8, DEFAULT_TRANSITION);
        animateTurbulence(0.35, DEFAULT_TRANSITION);
        animateDensity(0.2, DEFAULT_TRANSITION);
        animateGlow(0, DEFAULT_TRANSITION);
        animateWisp(1, DEFAULT_TRANSITION);
        return;
      case 'listening':
      case 'pre-connect-buffering':
        animateSpeed(0.16, DEFAULT_TRANSITION);
        animateScale(0.9, { type: 'spring', duration: 1.0, bounce: 0.35 });
        animateTurbulence(0.15, DEFAULT_TRANSITION);
        animateDensity(1.2, DEFAULT_TRANSITION);
        animateGlow([0.6, 1.0], DEFAULT_PULSE_TRANSITION);
        animateWisp(0, DEFAULT_TRANSITION);
        return;
      case 'connecting':
      case 'initializing':
        animateSpeed(0.35, DEFAULT_TRANSITION);
        animateScale(0.85, DEFAULT_TRANSITION);
        animateTurbulence(0.5, DEFAULT_TRANSITION);
        animateDensity(1.2, DEFAULT_TRANSITION);
        animateGlow([0.3, 1.0], DEFAULT_PULSE_TRANSITION);
        animateWisp(0, DEFAULT_TRANSITION);
        return;
      case 'thinking':
        animateSpeed(1.35, DEFAULT_TRANSITION);
        animateScale(0.85, DEFAULT_TRANSITION);
        animateTurbulence(0.5, DEFAULT_TRANSITION);
        animateDensity(1.2, DEFAULT_TRANSITION);
        animateGlow([0.3, 1.0], DEFAULT_PULSE_TRANSITION);
        animateWisp(0, DEFAULT_TRANSITION);
        return;
      case 'speaking':
        animateSpeed(0.5, DEFAULT_TRANSITION);
        animateScale(0.85, DEFAULT_TRANSITION);
        animateTurbulence(0.4, DEFAULT_TRANSITION);
        animateDensity(1.2, DEFAULT_TRANSITION);
        animateGlow(1.0, DEFAULT_TRANSITION);
        animateWisp(0, DEFAULT_TRANSITION);
        return;
    }
  }, [
    state,
    animateSpeed,
    animateScale,
    animateTurbulence,
    animateDensity,
    animateGlow,
    animateWisp,
  ]);

  useEffect(() => {
    if (state === 'speaking' && volume > 0 && !scaleMotionValue.isAnimating()) {
      animateScale(0.8 + 0.2 * volume, { duration: 0 });
      animateTurbulence(0.4 + 0.6 * volume, { duration: 0 });
    }
  }, [state, volume, scaleMotionValue, animateScale, animateTurbulence]);

  return {
    speed,
    scale,
    turbulence,
    density,
    glow,
    wisp,
  };
}
