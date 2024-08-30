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
  updateInterval: 10,
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
  const [frequencyBands, setFrequencyBands] = React.useState<Array<number>>([]);
  options.analyserOptions = { ...multibandDefaults.analyserOptions, ...options.analyserOptions };
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
      const binVolumes = fftToLogBins(
        normalizedFrequencies,
        analyser.context.sampleRate,
        opts.bands,
        opts.analyserOptions.fftSize!,
      );

      setFrequencyBands(binVolumes);
    };

    const interval = setInterval(updateVolume, opts.updateInterval);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [track, track?.mediaStream, JSON.stringify(options)]);

  return frequencyBands;
}

function calculateLogBinEdges(minFreq: number, maxFreq: number, numBins: number): number[] {
  const logBinEdges: number[] = [];
  const logMinFreq = Math.log(minFreq);
  const logMaxFreq = Math.log(maxFreq);
  const binWidth = (logMaxFreq - logMinFreq) / numBins;

  for (let i = 0; i <= numBins; i++) {
    logBinEdges.push(Math.exp(logMinFreq + i * binWidth));
  }

  return logBinEdges;
}

function fftToLogBins(
  rawFFTValues: Float32Array,
  sampleRate: number,
  numBins: number,
  fftSize: number,
): number[] {
  const deltaF = sampleRate / fftSize;

  // Define the min and max frequencies of interest
  const minFreq = deltaF; // Starting from the first FFT bin frequency
  const maxFreq = sampleRate / 2; // Nyquist frequency

  const logBinEdges = calculateLogBinEdges(minFreq, maxFreq, numBins);
  const logBinValues = new Array(numBins).fill(0);

  for (let i = 0; i < numBins; i++) {
    const startFreq = logBinEdges[i];
    const endFreq = logBinEdges[i + 1];

    const startBin = Math.ceil(startFreq / deltaF);
    const endBin = Math.floor(endFreq / deltaF);

    if (startBin >= rawFFTValues.length) {
      break;
    }

    for (let j = startBin; j <= endBin && j < rawFFTValues.length; j++) {
      logBinValues[i] += rawFFTValues[j];
    }
    logBinValues[i] /= endBin - startBin + 1;
  }

  return logBinValues;
}
