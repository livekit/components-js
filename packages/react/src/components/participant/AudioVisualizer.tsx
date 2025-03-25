import * as React from 'react';
import { type TrackReference } from '@livekit/components-core';
import { useEnsureTrackRef } from '../../context';
import { useMultibandTrackVolume } from '../../hooks';

/**
 * @public
 * @deprecated Use BarVisualizer instead
 */
export interface AudioVisualizerProps extends React.HTMLAttributes<SVGElement> {
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
 * @deprecated Use BarVisualizer instead
 */
export const AudioVisualizer: (
  props: AudioVisualizerProps & React.RefAttributes<SVGSVGElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<SVGSVGElement, AudioVisualizerProps>(
  function AudioVisualizer({ trackRef, ...props }: AudioVisualizerProps, ref) {
    const svgWidth = 200;
    const svgHeight = 90;
    const barWidth = 6;
    const barSpacing = 4;
    const volMultiplier = 50;
    const barCount = 7;
    const trackReference = useEnsureTrackRef(trackRef);

    const volumes = useMultibandTrackVolume(trackReference, { bands: 7, loPass: 300 });

    return (
      <svg
        ref={ref}
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
  },
);
