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
import { usePrefersReducedMotion } from '@/hooks/agents-ui/use-prefers-reduced-motion';

const DEFAULT_SPEED = 10;
const DEFAULT_AMPLITUDE = 2;
const DEFAULT_FREQUENCY = 0.5;
const DEFAULT_SCALE = 0.2;
const DEFAULT_BRIGHTNESS = 1.5;
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

export function useAgentAudioVisualizerAura(
  state: AgentState | undefined,
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder,
  volumeProp?: number,
) {
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const {
    value: scale,
    animate: animateScale,
    motionValue: scaleMotionValue,
  } = useAnimatedValue(DEFAULT_SCALE);
  const { value: amplitude, animate: animateAmplitude } = useAnimatedValue(DEFAULT_AMPLITUDE);
  const { value: frequency, animate: animateFrequency } = useAnimatedValue(DEFAULT_FREQUENCY);
  const { value: brightness, animate: animateBrightness } = useAnimatedValue(DEFAULT_BRIGHTNESS);

  const trackVolume = useTrackVolume(audioTrack as TrackReference, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });
  const volume = volumeProp ?? trackVolume;
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // With reduced motion, the aura holds still between states: no drift, no pulsing, and each
    // state's look applies at once. It still follows the agent's voice while speaking.
    const transition = reducedMotion ? { duration: 0 } : DEFAULT_TRANSITION;
    const pulse = (from: number, to: number) =>
      reducedMotion
        ? animateBrightness((from + to) / 2, transition)
        : animateBrightness([from, to], DEFAULT_PULSE_TRANSITION);
    const drift = (value: number) => setSpeed(reducedMotion ? 0 : value);

    switch (state) {
      case 'idle':
      case 'failed':
      case 'disconnected':
        drift(10);
        animateScale(0.2, transition);
        animateAmplitude(1.2, transition);
        animateFrequency(0.4, transition);
        animateBrightness(1.0, transition);
        return;
      case 'listening':
      case 'pre-connect-buffering':
        drift(20);
        animateScale(
          0.3,
          reducedMotion ? transition : { type: 'spring', duration: 1.0, bounce: 0.35 },
        );
        animateAmplitude(1.0, transition);
        animateFrequency(0.7, transition);
        pulse(1.5, 2.0);
        return;
      case 'thinking':
      case 'connecting':
      case 'initializing':
        drift(30);
        animateScale(0.3, transition);
        animateAmplitude(0.5, transition);
        animateFrequency(1, transition);
        pulse(0.5, 2.5);
        return;
      case 'speaking':
        drift(70);
        animateScale(0.3, transition);
        animateAmplitude(0.75, transition);
        animateFrequency(1.25, transition);
        animateBrightness(1.5, transition);
        return;
    }
  }, [state, reducedMotion, animateScale, animateAmplitude, animateFrequency, animateBrightness]);

  useEffect(() => {
    if (state === 'speaking' && volume > 0 && !scaleMotionValue.isAnimating()) {
      animateScale(0.2 + 0.2 * volume, { duration: 0 });
    }
  }, [
    state,
    volume,
    scaleMotionValue,
    animateScale,
    animateAmplitude,
    animateFrequency,
    animateBrightness,
  ]);

  return {
    speed,
    scale,
    amplitude,
    frequency,
    brightness,
  };
}
