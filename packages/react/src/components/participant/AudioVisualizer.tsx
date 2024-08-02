import * as React from 'react';
import { type TrackReference } from '@livekit/components-core';
import { useEnsureTrackRef } from '../../context';
import { useAudioWaveform } from '../../hooks';

/** @public */
export interface AudioVisualizerProps extends React.SVGProps<SVGSVGElement> {
  trackRef?: TrackReference;
  gap?: number;
  barWidth?: number;
  borderRadius?: string;
  barCount?: number;
  mode?: 'wave' | 'bars';
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
  SVGSVGElement,
  AudioVisualizerProps
>(function AudioVisualizer(
  {
    trackRef,
    gap = 1,
    borderRadius = '0.5rem',
    barCount = 128,
    viewBox = '0 0 512 180',
    mode = 'wave',
    ...props
  }: AudioVisualizerProps,
  ref,
) {
  const trackReference = useEnsureTrackRef(trackRef);

  const { bars } = useAudioWaveform(trackReference, {
    barCount,
    volMultiplier: 3,
    updateInterval: 50,
  });
  const [, , width, height] = viewBox.split(' ');

  const barWidth = (Number.parseInt(width) - barCount * gap) / barCount;

  return (
    <svg
      ref={ref}
      {...props}
      style={{ width: '100%', height: '100%' }}
      className="lk-audio-visualizer"
      viewBox={viewBox}
    >
      {mode === 'bars' &&
        bars.map((vol, idx) => (
          <rect
            key={idx}
            x={gap + idx * (barWidth + gap)}
            y={0}
            width={barWidth}
            height={Number.parseInt(height)}
            rx={borderRadius}
            style={{
              transform: `scale(1, ${vol}`,
              transformOrigin: 'center',
            }}
          ></rect>
        ))}
      {mode === 'wave' && (
        <path
          fill="none"
          style={{ strokeWidth: '1px', strokeLinecap: 'round' }}
          d={`${bars.reduce((acc, val, idx) => {
            const halfHeight = Number.parseInt(height) / 2;
            const barPos = (Number.parseInt(width) / barCount) * idx;
            if (idx === 0) {
              return `M 0 ${halfHeight} `;
            } else {
              acc += `L ${barPos} ${halfHeight + halfHeight * val * (idx % 2 === 0 ? 1 : -1)} `;
            }
            return acc;
          }, '')}`}
        />
      )}
    </svg>
  );
});
