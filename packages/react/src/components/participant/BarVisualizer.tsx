import * as React from 'react';
import { useBarAnimator } from './animators/useBarAnimator';
import { useMultibandTrackVolume, type AgentState } from '../../hooks';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useMaybeTrackRefContext } from '../../context';
import { cloneSingleChild, mergeProps } from '../../utils';

/**
 * @beta
 */
export type BarVisualizerOptions = {
  /** in percentage */
  maxHeight?: number;
  /** in percentage */
  minHeight?: number;
};

/**
 * @beta
 */
export interface BarVisualizerProps extends React.HTMLProps<HTMLDivElement> {
  /** If set, the visualizer will transition between different voice assistant states */
  state?: AgentState;
  /** Number of bars that show up in the visualizer */
  barCount?: number;
  trackRef?: TrackReferenceOrPlaceholder;
  options?: BarVisualizerOptions;
  /** The template component to be used in the visualizer. */
  children?: React.ReactNode;
}

const sequencerIntervals = new Map<AgentState, number>([
  ['connecting', 2000],
  ['initializing', 2000],
  ['listening', 500],
  ['thinking', 150],
]);

const getSequencerInterval = (
  state: AgentState | undefined,
  barCount: number,
): number | undefined => {
  if (state === undefined) {
    return 1000;
  }
  let interval = sequencerIntervals.get(state);
  if (interval) {
    switch (state) {
      case 'connecting':
        // case 'thinking':
        interval /= barCount;
        break;

      default:
        break;
    }
  }
  return interval;
};
/**
 * Visualizes audio signals from a TrackReference as bars.
 * If the `state` prop is set, it automatically transitions between VoiceAssistant states.
 * @beta
 *
 * @remarks For VoiceAssistant state transitions this component requires a voice assistant agent running with livekit-agents \>= 0.9.0
 *
 * @example
 * ```tsx
 * function SimpleVoiceAssistant() {
 *   const { state, audioTrack } = useVoiceAssistant();
 *   return (
 *    <BarVisualizer
 *      state={state}
 *      trackRef={audioTrack}
 *    />
 *   );
 * }
 * ```
 */
export const BarVisualizer = /* @__PURE__ */ React.forwardRef<HTMLDivElement, BarVisualizerProps>(
  function BarVisualizer(
    { state, options, barCount = 15, trackRef, children, ...props }: BarVisualizerProps,
    ref,
  ) {
    const elementProps = mergeProps(props, { className: 'lk-audio-bar-visualizer' });
    let trackReference = useMaybeTrackRefContext();

    if (trackRef) {
      trackReference = trackRef;
    }

    const volumeBands = useMultibandTrackVolume(trackReference, {
      bands: barCount,
      loPass: 100,
      hiPass: 200,
    });
    const minHeight = options?.minHeight ?? 20;
    const maxHeight = options?.maxHeight ?? 100;

    const highlightedIndices = useBarAnimator(
      state,
      barCount,
      getSequencerInterval(state, barCount) ?? 100,
    );

    return (
      <div ref={ref} {...elementProps} data-lk-va-state={state}>
        {volumeBands.map((volume, idx) =>
          children ? (
            cloneSingleChild(children, {
              'data-lk-highlighted': highlightedIndices.includes(idx),
              'data-lk-bar-index': idx,
              class: 'lk-audio-bar',
              style: { height: `${Math.min(maxHeight, Math.max(minHeight, volume * 100 + 5))}%` },
            })
          ) : (
            <span
              key={idx}
              data-lk-highlighted={highlightedIndices.includes(idx)}
              data-lk-bar-index={idx}
              className={`lk-audio-bar ${highlightedIndices.includes(idx) && 'lk-highlighted'}`}
              style={{
                // TODO transform animations would be more performant, however the border-radius gets distorted when using scale transforms. a 9-slice approach (or 3 in this case) could work
                // transform: `scale(1, ${Math.min(maxHeight, Math.max(minHeight, volume))}`,
                height: `${Math.min(maxHeight, Math.max(minHeight, volume * 100 + 5))}%`,
              }}
            ></span>
          ),
        )}
      </div>
    );
  },
);
