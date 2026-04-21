import * as React from 'react';
import { LocalAudioTrack } from 'livekit-client';
import { log } from '@livekit/components-core';
import type { KrispNoiseFilterProcessor, NoiseFilterOptions } from '@livekit/krisp-noise-filter';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useLocalParticipant } from '../../..';

/**
 * @beta
 */
export interface useKrispNoiseFilterOptions {
  /**
   * The track reference to use for the noise filter (defaults: local microphone track)
   */
  trackRef?: TrackReferenceOrPlaceholder;
  /**
   * @internal
   */
  filterOptions?: NoiseFilterOptions;
}

/**
 * Enable the Krisp enhanced noise cancellation feature for local audio tracks.
 *
 * Defaults to the localParticipant's microphone track publication, but you can override this behavior by passing in a different track reference.
 *
 * @package \@livekit/components-react/krisp
 * @remarks This filter requires that you install the `@livekit/krisp-noise-filter` package and is supported only on {@link https://cloud.livekit.io | LiveKit Cloud}.
 * @beta
 * @example
 * ```tsx
 * const krisp = useKrispNoiseFilter();
 * return <input
 *   type="checkbox"
 *   onChange={(ev) => krisp.setNoiseFilterEnabled(ev.target.checked)}
 *   checked={krisp.isNoiseFilterEnabled}
 *   disabled={krisp.isNoiseFilterPending}
 * />
 * ```
 * @returns Use `setIsNoiseFilterEnabled` to enable/disable the noise filter.
 */
export function useKrispNoiseFilter(options: useKrispNoiseFilterOptions = {}) {
  const [shouldEnable, setShouldEnable] = React.useState(false);
  const [isNoiseFilterPending, setIsNoiseFilterPending] = React.useState(false);
  const [isNoiseFilterEnabled, setIsNoiseFilterEnabled] = React.useState(false);
  let micPublication = useLocalParticipant().microphoneTrack;
  if (options.trackRef) {
    micPublication = options.trackRef.publication;
  }

  const setNoiseFilterEnabled = React.useCallback(async (enable: boolean) => {
    if (enable) {
      const { isKrispNoiseFilterSupported } = await import('@livekit/krisp-noise-filter');

      if (!isKrispNoiseFilterSupported()) {
        log.warn('LiveKit-Krisp noise filter is not supported in this browser');
        return;
      }
    }
    setShouldEnable((prev) => {
      if (prev !== enable) {
        setIsNoiseFilterPending(true);
      }
      return enable;
    });
  }, []);

  React.useEffect(() => {
    const track = micPublication?.track;
    if (!(track instanceof LocalAudioTrack)) return;

    const existing = track.getProcessor();
    // Processor already attached to this track — just sync enabled state.
    if (existing?.name === 'livekit-noise-filter') {
      setIsNoiseFilterPending(true);
      (existing as KrispNoiseFilterProcessor).setEnabled(shouldEnable).finally(() => {
        setIsNoiseFilterPending(false);
        setIsNoiseFilterEnabled(shouldEnable);
      });
      return;
    }

    if (!shouldEnable) return;

    // No processor on this track and the filter is wanted on — create a fresh
    // processor bound to this track's AudioContext and attach. Each track gets
    // its own processor: a KrispNoiseFilterProcessor's internal audio graph is
    // permanently bound to the AudioContext it was init'd against, so it can't
    // be reused across mic republishes (e.g. session.end() + session.start()).
    let cancelled = false;
    setIsNoiseFilterPending(true);
    (async () => {
      const { KrispNoiseFilter, isKrispNoiseFilterSupported } =
        await import('@livekit/krisp-noise-filter');
      if (cancelled) return;
      if (!isKrispNoiseFilterSupported()) {
        setIsNoiseFilterPending(false);
        return;
      }
      const processor = KrispNoiseFilter(options.filterOptions);
      try {
        await track.setProcessor(processor);
        // If the effect was cancelled while setProcessor was in flight, the
        // processor landed on a track the hook no longer manages (e.g. the
        // component unmounted with the track still alive via a caller-owned
        // trackRef). Undo the attach so the track is left as we found it.
        if (cancelled) {
          await track.stopProcessor();
          return;
        }
        await processor.setEnabled(true);
        if (cancelled) {
          await track.stopProcessor();
          return;
        }
        setIsNoiseFilterEnabled(true);
      } catch (e: any) {
        setIsNoiseFilterEnabled(false);
        log.error('Krisp hook: error enabling filter', e);
      } finally {
        setIsNoiseFilterPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shouldEnable, micPublication?.track, options.filterOptions]);

  const processor =
    micPublication?.track instanceof LocalAudioTrack
      ? (micPublication.track.getProcessor() as KrispNoiseFilterProcessor | undefined)
      : undefined;

  return {
    setNoiseFilterEnabled,
    isNoiseFilterEnabled,
    isNoiseFilterPending,
    processor,
  };
}
