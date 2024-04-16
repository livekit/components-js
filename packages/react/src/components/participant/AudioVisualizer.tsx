import * as React from 'react';
import { type TrackReference } from '@livekit/components-core';
import { useEnsureTrackRef } from '../../context';
import { useAudioWaveform } from '../../hooks';

/** @public */
export interface AudioVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackRef?: TrackReference;
}

function sigmoid(x: number, k = 2, s = 0) {
  return 1 / (1 + Math.exp(-(x - s) / k));
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
>(function AudioVisualizer({ trackRef, ...props }: AudioVisualizerProps, ref) {
  const barWidth = 2;
  const volMultiplier = 5;
  const trackReference = useEnsureTrackRef(trackRef);

  const [bars, setBars] = React.useState([] as Array<number>);
  const drawWave = React.useCallback((wave: Float32Array) => {
    setBars(Array.from(wave.map((v) => sigmoid(v * volMultiplier, 0.08, 0.2))));
  }, []);

  useAudioWaveform(drawWave, trackReference, {
    analyserOptions: { fftSize: 64 },
    aggregateTime: 20,
  });

  return (
    <div ref={ref} {...props} className="lk-audio-visualizer">
      {bars.map((vol, idx) => (
        <span
          key={idx}
          style={{ width: barWidth, transform: `scale(1, 1)`, height: `${vol * 100}%` }}
        ></span>
      ))}
    </div>
  );
});
