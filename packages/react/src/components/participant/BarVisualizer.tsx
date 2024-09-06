import * as React from 'react';
import { useBarAnimator } from './animators/useBarAnimator';
import { useMultibandTrackVolume, VoiceAssistantState } from '../../hooks';
import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useMaybeTrackRefContext } from '../../context';

export type GridAnimationOptions = {
  interval?: number;
  connectingRing?: number;
  onTransition?: string;
  offTransition?: string;
};

export type BarVisualizerOptions = {
  baseStyle: React.CSSProperties;
  gridComponent?: React.ComponentType<{ style: React.CSSProperties }>;
  gridSpacing?: string;
  onStyle?: React.CSSProperties;
  offStyle?: React.CSSProperties;
  transformer?: (distanceFromCenter: number) => React.CSSProperties;
  rowCount?: number;
  animationOptions?: GridAnimationOptions;
  maxHeight?: number;
  minHeight?: number;
  radiusFactor?: number;
  radial?: boolean;
  stateOptions?: {
    [key in VoiceAssistantState]: BarVisualizerOptions;
  };
};

export interface BarVisualizerProps extends React.HTMLProps<HTMLDivElement> {
  state: VoiceAssistantState;
  barCount: number;
  audioTrack?: TrackReferenceOrPlaceholder;
  options?: BarVisualizerOptions;
}

export const AgentBarVisualizer = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  BarVisualizerProps
>(function AgentBarVisualizer(
  { state, options, barCount, audioTrack, ...props }: BarVisualizerProps,
  ref,
) {
  let trackReference = useMaybeTrackRefContext();
  if (audioTrack) {
    trackReference = audioTrack;
  }

  const volumeBands = useMultibandTrackVolume(trackReference, {
    bands: barCount,
    loPass: 0,
    hiPass: 256,
  });
  const gridArray = Array.from({ length: barCount }).map((_, i) => i);
  const minHeight = (options?.minHeight ?? 10) / 100;
  const maxHeight = (options?.maxHeight ?? 100) / 100;
  const midpoint = Math.floor(barCount / 2.0);

  let animationOptions = options?.animationOptions;

  if (options?.stateOptions) {
    animationOptions = { ...animationOptions, ...options.stateOptions[state]?.animationOptions };
  }
  const highlightedIndices = useBarAnimator(
    state,
    barCount,
    animationOptions?.interval ?? 100,
    animationOptions,
  );

  // TODO: Remove useMemo
  const bars = React.useMemo(() => {
    const baseStyle = options?.baseStyle ?? {};
    const onStyle = {
      ...baseStyle,
      ...(options?.onStyle ?? {}),
      ...(options?.stateOptions ? options.stateOptions[state]?.onStyle : {}),
    };
    const offStyle = {
      ...baseStyle,
      ...(options?.offStyle ?? {}),
      ...(options?.stateOptions ? options.stateOptions[state]?.offStyle : {}),
    };
    return gridArray.map((x) => {
      const height = volumeBands[x] * (maxHeight - minHeight) + minHeight;
      console.log('height', height, volumeBands[x], minHeight, maxHeight);
      const distanceFromCenter = Math.abs(midpoint - x);
      const isIndexHighlighted =
        typeof highlightedIndices === 'object'
          ? highlightedIndices.includes(x)
          : highlightedIndices === x;
      return (
        <div
          key={x}
          style={{
            height: `${height}px`,
            ...(isIndexHighlighted || state === 'speaking' ? onStyle : offStyle),
            transition: isIndexHighlighted
              ? animationOptions?.onTransition
              : animationOptions?.offTransition,
            ...options?.transformer?.(distanceFromCenter),
          }}
        ></div>
      );
    });
  }, [
    options,
    gridArray,
    volumeBands,
    maxHeight,
    minHeight,
    midpoint,
    highlightedIndices,
    state,
    animationOptions,
  ]);

  return (
    <div
      ref={ref}
      {...props}
      className={`lk-audio-bar-visualizer`}
      data-lk-va-state={state}
      style={{
        height: `256px`,
      }}
    >
      {volumeBands.map((volume, idx) => (
        <span
          key={idx}
          className={`lk-audio-bar ${highlightedIndices.includes(idx) && 'highlighted'}`}
          style={{
            // transform: `scale(1, ${Math.min(maxHeight, Math.max(minHeight, volume))}`,
            height: `${Math.min(maxHeight, Math.max(minHeight, volume)) * 100}%`,
          }}
        ></span>
      ))}
    </div>
  );
});
