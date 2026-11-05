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

const DEFAULT_SPEED = 0.6;
const DEFAULT_DISTORTION = 0.3;
const DEFAULT_SWIRL = 0.15;
const DEFAULT_SCALE = 1;
const DEFAULT_ROTATION = 0;
const DEFAULT_TRANSITION: ValueAnimationTransition = { duration: 0.5, ease: 'easeOut' };
const DEFAULT_PULSE_TRANSITION: ValueAnimationTransition = {
  duration: 0.35,
  ease: 'easeOut',
  repeat: Infinity,
  repeatType: 'mirror',
};
const DEFAULT_SPIN_TRANSITION: ValueAnimationTransition = {
  duration: 8,
  ease: 'linear',
  repeat: Infinity,
  repeatType: 'loop',
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

export function useAgentAudioVisualizerMeshGradient(
  state: AgentState | undefined,
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder,
) {
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const {
    value: distortion,
    animate: animateDistortion,
    motionValue: distortionMotionValue,
  } = useAnimatedValue(DEFAULT_DISTORTION);
  const { value: swirl, animate: animateSwirl } = useAnimatedValue(DEFAULT_SWIRL);
  const { value: scale, animate: animateScale } = useAnimatedValue(DEFAULT_SCALE);
  const { value: rotation, animate: animateRotation } = useAnimatedValue(DEFAULT_ROTATION);

  const volume = useTrackVolume(audioTrack as TrackReference, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });

  useEffect(() => {
    switch (state) {
      case 'idle':
      case 'failed':
      case 'disconnected':
        setSpeed(0.3);
        animateDistortion(0.15, DEFAULT_TRANSITION);
        animateSwirl(0.05, DEFAULT_TRANSITION);
        animateScale(DEFAULT_SCALE, DEFAULT_TRANSITION);
        animateRotation(DEFAULT_ROTATION, DEFAULT_TRANSITION);
        return;
      case 'listening':
      case 'pre-connect-buffering':
        setSpeed(0.7);
        animateDistortion([0.35, 0.5], { type: 'spring', duration: 1.0, bounce: 0.35 });
        animateSwirl(0.3, DEFAULT_TRANSITION);
        animateScale(DEFAULT_SCALE, DEFAULT_TRANSITION);
        animateRotation(DEFAULT_ROTATION, DEFAULT_TRANSITION);
        return;
      case 'thinking':
      case 'connecting':
      case 'initializing':
        setSpeed(1.1);
        animateDistortion(0.5, DEFAULT_TRANSITION);
        animateSwirl([0.2, 0.45], DEFAULT_PULSE_TRANSITION);
        animateScale([1, 1.15], DEFAULT_PULSE_TRANSITION);
        animateRotation(DEFAULT_ROTATION, DEFAULT_TRANSITION);
        return;
      case 'speaking':
        setSpeed(1.0);
        animateDistortion(0.4, DEFAULT_TRANSITION);
        animateSwirl(0.35, DEFAULT_TRANSITION);
        animateScale(DEFAULT_SCALE, DEFAULT_TRANSITION);
        animateRotation(360, DEFAULT_SPIN_TRANSITION);
        return;
    }
  }, [state, animateDistortion, animateSwirl, animateScale, animateRotation]);

  useEffect(() => {
    if (state === 'speaking' && volume > 0 && !distortionMotionValue.isAnimating()) {
      animateDistortion(0.25 + 0.5 * volume, { duration: 0 });
    }
  }, [state, volume, distortionMotionValue, animateDistortion]);

  return {
    speed,
    distortion,
    swirl,
    scale,
    rotation,
  };
}
