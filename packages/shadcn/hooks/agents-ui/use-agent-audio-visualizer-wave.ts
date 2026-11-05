import { useRef, useState, useEffect, useCallback } from 'react';
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
import { LocalAudioTrack, RemoteAudioTrack } from 'livekit-client';
import { usePrefersReducedMotion } from '@/hooks/agents-ui/use-prefers-reduced-motion';

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
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const { value: amplitude, animate: animateAmplitude } = useAnimatedValue(DEFAULT_AMPLITUDE);
  const { value: frequency, animate: animateFrequency } = useAnimatedValue(DEFAULT_FREQUENCY);
  const { value: opacity, animate: animateOpacity } = useAnimatedValue(1.0);

  const trackVolume = useTrackVolume(audioTrack as TrackReference, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });
  const volume = volumeProp ?? trackVolume;
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // With reduced motion, the wave holds still between states: no scrolling, no pulsing, and each
    // state's look applies at once. It still follows the agent's voice while speaking.
    const transition = reducedMotion ? { duration: 0 } : DEFAULT_TRANSITION;
    const pulse = (duration: number) =>
      reducedMotion
        ? animateOpacity(0.65, transition)
        : animateOpacity([1.0, 0.3], { duration, repeat: Infinity, repeatType: 'mirror' });
    const scroll = (value: number) => setSpeed(reducedMotion ? 0 : value);

    switch (state) {
      case 'disconnected':
        scroll(DEFAULT_SPEED);
        animateAmplitude(0, transition);
        animateFrequency(0, transition);
        animateOpacity(1.0, transition);
        return;
      case 'listening':
        scroll(DEFAULT_SPEED);
        animateAmplitude(DEFAULT_AMPLITUDE, transition);
        animateFrequency(DEFAULT_FREQUENCY, transition);
        pulse(0.75);
        return;
      case 'thinking':
      case 'connecting':
      case 'initializing':
        scroll(DEFAULT_SPEED * 4);
        animateAmplitude(DEFAULT_AMPLITUDE / 4, transition);
        animateFrequency(DEFAULT_FREQUENCY * 4, transition);
        pulse(0.4);
        return;
      case 'speaking':
      default:
        scroll(DEFAULT_SPEED * 2);
        animateAmplitude(DEFAULT_AMPLITUDE, transition);
        animateFrequency(DEFAULT_FREQUENCY, transition);
        animateOpacity(1.0, transition);
        return;
    }
  }, [state, reducedMotion, setSpeed, animateAmplitude, animateFrequency, animateOpacity]);

  useEffect(() => {
    if (state === 'speaking') {
      animateAmplitude(0.015 + 0.4 * volume, { duration: 0 });
      animateFrequency(20 + 60 * volume, { duration: 0 });
    }
  }, [state, volume, animateAmplitude, animateFrequency]);

  return {
    speed,
    amplitude,
    frequency,
    opacity,
  };
}
