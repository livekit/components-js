import * as React from 'react';
import type { LocalAudioTrack, RemoteAudioTrack, AudioAnalyserOptions } from 'livekit-client';
import { Track, createAudioAnalyser } from 'livekit-client';
import {
  type TrackReference,
  isTrackReference,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-core';

/**
 * @alpha
 * Hook for tracking the volume of an audio track using the Web Audio API.
 */
export const useTrackVolume = (
  trackOrTrackReference?: LocalAudioTrack | RemoteAudioTrack | TrackReference,
  options: AudioAnalyserOptions = { fftSize: 32, smoothingTimeConstant: 0 },
) => {
  const track = isTrackReference(trackOrTrackReference)
    ? <LocalAudioTrack | RemoteAudioTrack | undefined>trackOrTrackReference.publication.track
    : trackOrTrackReference;
  const [volume, setVolume] = React.useState(0);
  React.useEffect(() => {
    if (!track || !track.mediaStream) {
      return;
    }

    const { cleanup, analyser } = createAudioAnalyser(track, options);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const a = dataArray[i];
        sum += a * a;
      }
      setVolume(Math.sqrt(sum / dataArray.length) / 255);
    };

    const interval = setInterval(updateVolume, 1000 / 30);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [track, track?.mediaStream, JSON.stringify(options)]);

  return volume;
};

const normalizeFrequencies = (frequencies: Float32Array) => {
  const normalizeDb = (value: number) => {
    const minDb = -100;
    const maxDb = -10;
    let db = 1 - (Math.max(minDb, Math.min(maxDb, value)) * -1) / 100;
    db = Math.sqrt(db);

    return db;
  };

  // Normalize all frequency values
  return frequencies.map((value) => {
    if (value === -Infinity) {
      return 0;
    }
    return normalizeDb(value);
  });
};

/**
 * Interface for configuring options for the useMultibandTrackVolume hook.
 * @alpha
 */
export interface MultiBandTrackVolumeOptions {
  bands?: number;
  /**
   * cut off of frequency bins on the lower end
   * Note: this is not a frequency measure, but in relation to analyserOptions.fftSize,
   */
  loPass?: number;
  /**
   * cut off of frequency bins on the higher end
   * Note: this is not a frequency measure, but in relation to analyserOptions.fftSize,
   */
  hiPass?: number;
  /**
   * update should run every x ms
   */
  updateInterval?: number;
  analyserOptions?: AnalyserOptions;
}

const multibandDefaults = {
  bands: 5,
  loPass: 100,
  hiPass: 600,
  updateInterval: 10,
  analyserOptions: { fftSize: 2048 },
} as const satisfies MultiBandTrackVolumeOptions;

/**
 * Hook for tracking the volume of an audio track across multiple frequency bands using the Web Audio API.
 * @alpha
 */
export const useMultibandTrackVolume = (
  trackOrTrackReference?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder,
  options: MultiBandTrackVolumeOptions = {},
) => {
  const track =
    trackOrTrackReference instanceof Track
      ? trackOrTrackReference
      : <LocalAudioTrack | RemoteAudioTrack | undefined>trackOrTrackReference?.publication?.track;
  const [frequencyBands, setFrequencyBands] = React.useState<Array<number>>([]);
  const opts = { ...multibandDefaults, ...options };
  React.useEffect(() => {
    if (!track || !track?.mediaStream) {
      return;
    }
    const { analyser, cleanup } = createAudioAnalyser(track, opts.analyserOptions);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const updateVolume = () => {
      analyser.getFloatFrequencyData(dataArray);
      let frequencies: Float32Array = new Float32Array(dataArray.length);
      for (let i = 0; i < dataArray.length; i++) {
        frequencies[i] = dataArray[i];
      }
      frequencies = frequencies.slice(options.loPass, options.hiPass);

      const normalizedFrequencies = normalizeFrequencies(frequencies);
      const chunkSize = Math.ceil(normalizedFrequencies.length / opts.bands);
      const chunks: Array<number> = [];
      for (let i = 0; i < opts.bands; i++) {
        const summedVolumes = normalizedFrequencies
          .slice(i * chunkSize, (i + 1) * chunkSize)
          .reduce((acc, val) => (acc += val), 0);
        chunks.push(summedVolumes / chunkSize);
      }

      setFrequencyBands(chunks);
    };

    const interval = setInterval(updateVolume, opts.updateInterval);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [track, track?.mediaStream, JSON.stringify(options)]);

  return frequencyBands;
};
