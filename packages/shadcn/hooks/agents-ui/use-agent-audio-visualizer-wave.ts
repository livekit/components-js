import { useRef, useState, useEffect, useCallback, useSyncExternalStore } from 'react';
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
import type { LocalAudioTrack, RemoteAudioTrack } from 'livekit-client';

const DEFAULT_SPEED = 5;
const DEFAULT_AMPLITUDE = 0.025;
const DEFAULT_FREQUENCY = 10;
const DEFAULT_TRANSITION: ValueAnimationTransition = { duration: 0.2, ease: 'easeOut' };

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia?.(REDUCED_MOTION_QUERY);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

function getReducedMotion() {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;
}

// Start still during hydration, before the browser preference is available.
const getServerReducedMotion = () => true;

function useAnimatedValue<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const motionValue = useMotionValue(initialValue);
  const controlsRef = useRef<AnimationPlaybackControlsWithThen | null>(null);
  useMotionValueEvent(motionValue, 'change', (value) => setValue(value as T));

  const stop = useCallback(() => controlsRef.current?.stop(), []);
  useEffect(() => stop, [stop]);

  const animateFn = useCallback(
    (targetValue: T | T[], transition: ValueAnimationTransition) => {
      controlsRef.current?.stop();
      controlsRef.current = animate(motionValue, targetValue, transition);
    },
    [motionValue],
  );

  return { value, stop, animate: animateFn };
}

interface UseAgentAudioVisualizerWaveAnimatorArgs {
  state?: AgentState;
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder;
  volume?: number;
}

export function useAgentAudioVisualizerWave({
  state,
  audioTrack,
  volume: volumeProp,
}: UseAgentAudioVisualizerWaveAnimatorArgs) {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const {
    value: amplitude,
    animate: animateAmplitude,
    stop: stopAmplitude,
  } = useAnimatedValue(DEFAULT_AMPLITUDE);
  const {
    value: frequency,
    animate: animateFrequency,
    stop: stopFrequency,
  } = useAnimatedValue(DEFAULT_FREQUENCY);
  const { value: opacity, animate: animateOpacity, stop: stopOpacity } = useAnimatedValue(1.0);

  const trackVolume = useTrackVolume(audioTrack as TrackReference, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });
  const volume = volumeProp ?? trackVolume;

  useEffect(() => {
    if (reducedMotion) {
      stopAmplitude();
      stopFrequency();
      stopOpacity();
      return;
    }
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
  }, [
    state,
    reducedMotion,
    setSpeed,
    animateAmplitude,
    animateFrequency,
    animateOpacity,
    stopAmplitude,
    stopFrequency,
    stopOpacity,
  ]);

  useEffect(() => {
    if (state === 'speaking' && !reducedMotion) {
      animateAmplitude(0.015 + 0.4 * volume, { duration: 0 });
      animateFrequency(20 + 60 * volume, { duration: 0 });
    }
  }, [state, volume, reducedMotion, animateAmplitude, animateFrequency]);

  if (reducedMotion) {
    const inactive = state === 'disconnected' || state === 'idle' || state === 'failed';
    const busy =
      state === 'thinking' ||
      state === 'connecting' ||
      state === 'initializing' ||
      state === 'pre-connect-buffering';
    const speaking = state === 'speaking' || state === undefined;
    // Keep the wave's visual language, with stable silhouettes instead of travel,
    // pulsing, or volume-driven deformation. State changes still update immediately.
    return {
      reducedMotion,
      speed: 0,
      amplitude: inactive
        ? 0
        : busy
          ? DEFAULT_AMPLITUDE / 4
          : speaking
            ? DEFAULT_AMPLITUDE * 3
            : DEFAULT_AMPLITUDE,
      frequency: busy
        ? DEFAULT_FREQUENCY * 4
        : speaking
          ? DEFAULT_FREQUENCY * 2
          : DEFAULT_FREQUENCY,
      opacity: 1,
    };
  }

  return {
    reducedMotion,
    speed,
    amplitude,
    frequency,
    opacity,
  };
}
