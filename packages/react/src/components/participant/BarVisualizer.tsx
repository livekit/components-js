import * as React from 'react';
import { useBarAnimator } from './animators/useBarAnimator';
import { useMultibandTrackVolume, type VoiceAssistantState } from '../../hooks';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useMaybeTrackRefContext } from '../../context';

export type BarVisualizerOptions = {
  maxHeight?: number;
  minHeight?: number;
};

export interface BarVisualizerProps extends React.HTMLProps<HTMLDivElement> {
  state: VoiceAssistantState;
  barCount: number;
  audioTrack?: TrackReferenceOrPlaceholder;
  options?: BarVisualizerOptions;
}

const sequencerIntervals = new Map<VoiceAssistantState, number>([
  ['connecting', 25 * 15],
  ['listening', 500],
  ['thinking', 40 * 15],
]);

const getSequencerInterval = (state: VoiceAssistantState, barCount: number): number | undefined => {
  let interval = sequencerIntervals.get(state);
  if (interval) {
    switch (state) {
      case 'connecting':
      case 'thinking':
        interval /= barCount;
        break;

      default:
        break;
    }
  }
  return interval;
};

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
    loPass: 100,
    hiPass: 356,
  });
  const minHeight = options?.minHeight ?? 20;
  const maxHeight = options?.maxHeight ?? 100;

  const highlightedIndices = useBarAnimator(
    state,
    barCount,
    getSequencerInterval(state, barCount) ?? 100,
  );

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
          className={`lk-audio-bar ${highlightedIndices.includes(idx) && 'lk-highlighted'}`}
          style={{
            // TODO transform animations would be more performant, however the border-radius gets distorted when using scale transforms. a 9-slice approach (or 3 in this case) could work
            // transform: `scale(1, ${Math.min(maxHeight, Math.max(minHeight, volume))}`,
            height: `${Math.min(maxHeight, Math.max(minHeight, volume * 100 + 5))}%`,
          }}
        ></span>
      ))}
    </div>
  );
});
