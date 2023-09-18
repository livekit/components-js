import type { Participant } from 'livekit-client';
import { createAudioAnalyser, LocalAudioTrack, RemoteAudioTrack, Track } from 'livekit-client';
import * as React from 'react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useTrack } from '../../hooks/useTrack';
import { useMaybeParticipantContext, useMaybeTrackRefContext } from '../../context';

/** @public */
export interface AudioVisualizerProps extends React.HTMLAttributes<SVGElement> {
  /** @deprecated this property will be removed in a future version, use `trackRef` instead */
  participant?: Participant;
  trackRef?: TrackReferenceOrPlaceholder;
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
  const [volumeBars, setVolumeBars] = React.useState<Array<number>>([]);

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

  const { track } = useTrack(ref);

  React.useEffect(() => {
    if (!track || !(track instanceof LocalAudioTrack || track instanceof RemoteAudioTrack)) {
      return;
    }
    const { analyser, cleanup } = createAudioAnalyser(track, {
      smoothingTimeConstant: 0.8,
      fftSize: 64,
    });

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const calculateBars = () => {
      analyser.getByteFrequencyData(dataArray);
      const sums: Array<number> = new Array(barCount).fill(0);
      dataArray.slice(1);
      const binSize = 6;

      for (let i = 0; i < barCount / 2; i += 1) {
        const id = Math.floor(barCount / 2 - i);
        for (let k = 0; k < binSize; k += 1) {
          sums[id] += Math.pow(dataArray[i * binSize + k] / 255, 2);
        }
        sums[id] /= binSize;
      }
      for (let i = 0; i < barCount / 2; i += 1) {
        const id = Math.floor(barCount / 2 + i);
        if (sums[id] !== 0) {
          continue;
        }
        for (let k = 0; k < binSize; k += 1) {
          sums[id] += Math.pow(dataArray[i * binSize + k] / 255, 2);
        }
        sums[id] /= binSize;
      }
      return sums.map((s) => s * volMultiplier);
    };

    const calcInterval = setInterval(() => {
      const bars = calculateBars();
      setVolumeBars(bars);
    }, 100);

    return () => {
      clearInterval(calcInterval);
      cleanup();
    };
  }, [track]);

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
        {volumeBars.map((vol, idx) => (
          <rect
            key={idx}
            x={idx * (barWidth + barSpacing)}
            y={svgHeight / 2 - vol / 2}
            width={barWidth}
            height={vol}
          ></rect>
        ))}
      </g>
    </svg>
  );
}
