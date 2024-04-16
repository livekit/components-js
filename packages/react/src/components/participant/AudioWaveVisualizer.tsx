import type { TrackReference } from '@livekit/components-core';
import * as React from 'react';
import { useMaybeTrackRefContext } from '../../context';
import { useAudioWaveform } from '../../hooks';

/** @public */
export interface AudioVisualizerProps extends React.HTMLAttributes<HTMLCanvasElement> {
  trackRef?: TrackReference;
}

export function AudioWaveVisualizer({ trackRef, ...props }: AudioVisualizerProps) {
  const trackReferenceContext = useMaybeTrackRefContext();

  const canvasEl = React.useRef<HTMLCanvasElement>(null);
  const previousTimeStamp = React.useRef(0);

  const drawWave = React.useCallback(
    (wave: Float32Array) => {
      const ctx = canvasEl.current?.getContext('2d');

      console.log(canvasEl, ctx);
      if (!ctx || !canvasEl.current) {
        return;
      }
      canvasEl.current.width = 200;
      canvasEl.current.height = 200;

      const { width, height } = canvasEl.current;

      ctx.fillStyle = 'rgb(200 200 200)';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0 0 0)';
      ctx.beginPath();

      const sliceWidth = width / wave.length;
      let x = 0;

      for (let i = 0; i < wave.length; i++) {
        const v = (wave[i] + 0.5) * 2;
        const y = v * (height / 2);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
        previousTimeStamp.current = performance.now();
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    },
    [canvasEl, canvasEl.current],
  );

  useAudioWaveform(drawWave, trackRef ?? trackReferenceContext, {
    analyserOptions: { fftSize: 1024 },
  });

  return (
    <canvas ref={canvasEl} width="100%" height="100%" {...props} className="lk-audio-visualizer" />
  );
}
