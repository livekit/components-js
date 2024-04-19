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

function sigmoid(x: number, k = 2, s = 0) {
  return 1 / (1 + Math.exp(-(x - s) / k));
}

function closestPow2(x: number) {
  let pow = x;
  pow -= 1;
  pow |= pow >> 1;
  pow |= pow >> 2;
  pow |= pow >> 4;
  pow |= pow >> 16;
  pow += 1;
  return pow;
}

function getFFTSizeValue(x: number) {
  if (x < 32) return 32;
  else return closestPow2(x);
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
    borderRadius = '0.25rem',
    barCount = 240,
    ...props
  }: AudioVisualizerProps,
  ref,
) {
  const volMultiplier = 5;
  const trackReference = useEnsureTrackRef(trackRef);

  const [bars, setBars] = React.useState([] as Array<number>);
  const drawWave = React.useCallback((wave: Float32Array) => {
    setBars(Array.from(wave.slice(0, barCount).map((v) => sigmoid(v * volMultiplier, 0.08, 0.2))));
  }, []);

  useAudioWaveform(drawWave, trackReference, {
    analyserOptions: { fftSize: getFFTSizeValue(barCount) },
    aggregateTime: 20,
  });

  return (
    <div ref={ref} {...props} style={{ gap: gap }} className="lk-audio-visualizer">
      {bars.map((vol, idx) => (
        <span
          key={idx}
          style={{
            width: barWidth,
            transform: `scale(1, 1)`,
            height: `${vol * 100}%`,
            borderRadius,
          }}
        ></span>
      ))}
    </div>
  );
});
