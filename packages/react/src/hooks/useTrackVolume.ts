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
export function useTrackVolume(
  trackOrTrackReference?: LocalAudioTrack | RemoteAudioTrack | TrackReference,
  options: AudioAnalyserOptions = { fftSize: 32, smoothingTimeConstant: 0 },
) {
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
}

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
  updateInterval: 32,
  analyserOptions: { fftSize: 2048 },
} as const satisfies MultiBandTrackVolumeOptions;

/**
 * Hook for tracking the volume of an audio track across multiple frequency bands using the Web Audio API.
 * @alpha
 */
export function useMultibandTrackVolume(
  trackOrTrackReference?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder,
  options: MultiBandTrackVolumeOptions = {},
) {
  const track =
    trackOrTrackReference instanceof Track
      ? trackOrTrackReference
      : <LocalAudioTrack | RemoteAudioTrack | undefined>trackOrTrackReference?.publication?.track;
  const opts = { ...multibandDefaults, ...options };
  const [frequencyBands, setFrequencyBands] = React.useState<Array<number>>(
    new Array(opts.bands).fill(0),
  );

  React.useEffect(() => {
    if (!track || !track?.mediaStream) {
      setFrequencyBands((val) => val.slice().fill(0));
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

      const normalizedFrequencies = normalizeFrequencies(frequencies); // is this needed ?
      const chunkSize = Math.ceil(normalizedFrequencies.length / opts.bands); // we want logarithmic chunking here
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
}

/**
 * @alpha
 */
export interface AudioWaveformOptions {
  barCount?: number;
  volMultiplier?: number;
  updateInterval?: number;
}

const waveformDefaults = {
  barCount: 120,
  volMultiplier: 5,
  updateInterval: 20,
} as const satisfies AudioWaveformOptions;

/**
 * @alpha
 */
export function useAudioWaveform(
  trackOrTrackReference?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder,
  options: AudioWaveformOptions = {},
) {
  const track =
    trackOrTrackReference instanceof Track
      ? trackOrTrackReference
      : <LocalAudioTrack | RemoteAudioTrack | undefined>trackOrTrackReference?.publication?.track;
  const opts = { ...waveformDefaults, ...options };

  const aggregateWave = React.useRef(new Float32Array());
  const timeRef = React.useRef(performance.now());
  const updates = React.useRef(0);
  const [bars, setBars] = React.useState<number[]>([]);

  const onUpdate = React.useCallback((wave: Float32Array) => {
    setBars(
      Array.from(
        filterData(wave, opts.barCount).map((v) => Math.sqrt(v) * opts.volMultiplier),
        // wave.slice(0, opts.barCount).map((v) => sigmoid(v * opts.volMultiplier, 0.08, 0.2)),
      ),
    );
  }, []);

  React.useEffect(() => {
    if (!track || !track?.mediaStream) {
      return;
    }
    const { analyser, cleanup } = createAudioAnalyser(track, {
      fftSize: getFFTSizeValue(opts.barCount),
    });

    const bufferLength = getFFTSizeValue(opts.barCount);
    const dataArray = new Float32Array(bufferLength);

    const update = () => {
      updateWaveform = requestAnimationFrame(update);
      analyser.getFloatTimeDomainData(dataArray);
      aggregateWave.current.map((v, i) => v + dataArray[i]);
      updates.current += 1;

      if (performance.now() - timeRef.current >= opts.updateInterval) {
        const newData = dataArray.map((v) => v / updates.current);
        onUpdate(newData);
        timeRef.current = performance.now();
        updates.current = 0;
      }
    };

    let updateWaveform = requestAnimationFrame(update);

    return () => {
      cleanup();
      cancelAnimationFrame(updateWaveform);
    };
  }, [track, track?.mediaStream, JSON.stringify(options), onUpdate]);

  return {
    bars,
  };
}

function getFFTSizeValue(x: number) {
  if (x < 32) return 32;
  else return pow2ceil(x);
}

// function sigmoid(x: number, k = 2, s = 0) {
//   return 1 / (1 + Math.exp(-(x - s) / k));
// }

function pow2ceil(v: number) {
  let p = 2;
  while ((v >>= 1)) {
    p <<= 1;
  }
  return p;
}

function filterData(audioData: Float32Array, numSamples: number) {
  const blockSize = Math.floor(audioData.length / numSamples); // the number of samples in each subdivision
  const filteredData = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(audioData[blockStart + j]); // find the sum of all the samples in the block
    }
    filteredData[i] = sum / blockSize; // divide the sum by the block size to get the average
  }
  return filteredData;
}

// function normalizeData(audioData: Float32Array) {
//   const multiplier = Math.pow(Math.max(...audioData), -1);
//   return audioData.map((n) => n * multiplier);
// }
