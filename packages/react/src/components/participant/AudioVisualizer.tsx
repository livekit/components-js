import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { type TrackReference } from '@livekit/components-core';
import { useMaybeParticipantContext, useMaybeTrackRefContext } from '../../context';
import { useMultibandTrackVolume } from '../../hooks';

/** @public */
export interface AudioVisualizerProps extends React.HTMLAttributes<SVGElement> {
  /** @deprecated this property will be removed in a future version, use `trackRef` instead */
  participant?: Participant;
  trackRef?: TrackReference;
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
export function AudioVisualizer({ participant, trackRef, ...props }: AudioVisualizerProps) {
  const svgWidth = 200;
  const svgHeight = 90;
  const barWidth = 6;
  const barSpacing = 4;
  const volMultiplier = 50;
  const barCount = 7;

  const p = useMaybeParticipantContext() ?? participant;
  let ref = useMaybeTrackRefContext() ?? trackRef;
  if (!ref) {
    if (!p) {
      throw Error(`Participant missing, provide it directly or within a context`);
    }
    ref = { participant: p, source: Track.Source.Microphone };
  }

  const volumes = useMultibandTrackVolume(ref, { bands: 7, loPass: 300 });

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      {...props}
      className="lk-audio-visualizer"
    >
      <rect x="0" y="0" width="100%" height="100%" />
      <g
        style={{
          transform: `translate(${(svgWidth - barCount * (barWidth + barSpacing)) / 2}px, 0)`,
        }}
      >
        {volumes.map((vol, idx) => (
          <rect
            key={idx}
            x={idx * (barWidth + barSpacing)}
            y={svgHeight / 2 - (vol * volMultiplier) / 2}
            width={barWidth}
            height={vol * volMultiplier}
          ></rect>
        ))}
      </g>
    </svg>
  );
}
