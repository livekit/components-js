import * as React from 'react';
import { type TrackReference } from '@livekit/components-core';
import { useEnsureTrackRef } from '../../context';
import { useAudioWaveform } from '../../hooks';

/** @public */
export interface AudioVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackRef?: TrackReference;
  gap?: string;
  barWidth?: string;
  borderRadius?: string;
  barCount?: number;
}

/**
 * The AudioVisualizer component is used to visualize the audio volume of a given audio track.
 * @remarks
 * Requires a `TrackReferenceOrPlaceholder` to be provided either as a property or via the `TrackRefContext`.
 * @example
 * ```tsx
 * <AudioVisualizer />
 * ```
 * @public
 */
export const AudioVisualizer = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  AudioVisualizerProps
>(function AudioVisualizer(
  {
    trackRef,
    barWidth = '0.5rem',
    gap = '0',
    borderRadius = '0rem',
    barCount = 510,
    ...props
  }: AudioVisualizerProps,
  ref,
) {
  const trackReference = useEnsureTrackRef(trackRef);

  const { bars } = useAudioWaveform(trackReference, {
    barCount,
    volMultiplier: 4,
    updateInterval: 50,
  });

  return (
    <div ref={ref} {...props} style={{ gap: gap }} className="lk-audio-visualizer">
      {bars.map((vol, idx) => (
        <span
          key={idx}
          style={{
            width: barWidth,
            transform: `scale(1, ${vol})`,
            height: `100%`,
            borderRadius,
          }}
        ></span>
      ))}
    </div>
  );
});
