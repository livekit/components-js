import { AgentState } from '../../hooks';
import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { LocalAudioTrack, RemoteAudioTrack } from 'livekit-client';
import * as React from 'react';
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
    /** @deprecated use `track` field instead */
    trackRef?: TrackReferenceOrPlaceholder;
    track?: TrackReferenceOrPlaceholder | LocalAudioTrack | RemoteAudioTrack;
    options?: BarVisualizerOptions;
    /** The template component to be used in the visualizer. */
    children?: React.ReactNode;
}
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
 *
 * @example
 *  Styling the BarVisualizer using CSS classes
 * ```css
 * .lk-audio-bar {
 *  // Styles for "idle" bars
 *  }
 * .lk-audio-bar.lk-highlighted {
 *  // Styles for "active" bars
 * }
 * ```
 *
 * @example
 * Styling the BarVisualizer using CSS custom properties
 * ```css
 * --lk-fg // for the "active" colour, note that this defines the main foreground colour for the whole "theme"
 * --lk-va-bg // for "idle" colour
 * ```
 *
 * @example
 * Using a custom bar template for the BarVisualizer
 * ```tsx
 * <BarVisualizer>
 *   <div className="all the classes" />
 * </BarVisualizer>
 * ```
 * the highlighted children will get a data prop of data-lk-highlighted for them to switch between active and idle bars in their own template bar
 */
export declare const BarVisualizer: React.ForwardRefExoticComponent<Omit<BarVisualizerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=BarVisualizer.d.ts.map