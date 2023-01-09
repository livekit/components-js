import { createAudioAnalyser, Participant, Track } from 'livekit-client';
import React from 'react';
import { useEnsureParticipant } from '../../contexts';
import { useMediaTrack } from '../../hooks';

export interface AudioVisualizerProps extends React.HTMLAttributes<SVGElement> {
  participant?: Participant;
}

export function AudioVisualizer({ participant, ...props }: AudioVisualizerProps) {
  const p = useEnsureParticipant(participant);
  const [volumeBars, setVolumeBars] = React.useState<Array<number>>([]);

  const svgWidth = 200;
  const svgHeight = 90;
  const barWidth = 8;
  const barSpacing = 4;
  const volMultiplier = 50;
  const barCount = 7;

  const { track } = useMediaTrack({ participant: p, source: Track.Source.Microphone });

  React.useEffect(() => {
    console.log('track update', track);
    if (!track) {
      return;
    }
    // @ts-ignore TODO fix type in livekit-client - should only be Local/RemoteAudioTrack
    const { analyser, cleanup } = createAudioAnalyser(track, {
      smoothingTimeConstant: 0.8,
      fftSize: 32,
    });

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const calculateBars = () => {
      analyser.getByteFrequencyData(dataArray);
      const sums: Array<number> = new Array(barCount).fill(0);
      dataArray.slice(1);
      const binSize = 2;

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
    }, 50);

    return () => {
      clearInterval(calcInterval);
      cleanup();
    };
  }, [track]);

  return (
    <svg width={svgWidth} height={svgHeight} fill="white" {...props}>
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <g
        style={{
          transform: `translate(${(svgWidth - barCount * (barWidth + barSpacing)) / 2}px, 0)`,
        }}
      >
        {volumeBars.map((vol, idx) => (
          <rect
            style={{ transition: `height 100ms ease-out, y 100ms ease-out` }}
            key={idx}
            x={idx * (barWidth + barSpacing)}
            rx={4}
            y={svgHeight / 2 - vol / 2}
            width={barWidth}
            height={vol}
            fill="black"
          ></rect>
        ))}
      </g>
    </svg>
  );
}
