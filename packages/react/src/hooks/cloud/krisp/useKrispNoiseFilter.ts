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
  const [krispProcessor, setKrispProcessor] = React.useState<
    KrispNoiseFilterProcessor | undefined
  >();
  if (options.trackRef) {
    micPublication = options.trackRef.publication;
  }

  const setNoiseFilterEnabled = React.useCallback(async (enable: boolean) => {
    if (enable) {
      const { KrispNoiseFilter, isKrispNoiseFilterSupported } = await import(
        '@livekit/krisp-noise-filter'
      );

      if (!isKrispNoiseFilterSupported()) {
        log.warn('LiveKit-Krisp noise filter is not supported in this browser');
        return;
      }
      if (!krispProcessor) {
        setKrispProcessor(KrispNoiseFilter(options.filterOptions));
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
    if (micPublication && micPublication.track instanceof LocalAudioTrack && krispProcessor) {
      const currentProcessor = micPublication.track.getProcessor();
      if (currentProcessor && currentProcessor.name === 'livekit-noise-filter') {
        setIsNoiseFilterPending(true);
        (currentProcessor as KrispNoiseFilterProcessor).setEnabled(shouldEnable).finally(() => {
          setIsNoiseFilterPending(false);
          setIsNoiseFilterEnabled(shouldEnable);
        });
      } else if (!currentProcessor && shouldEnable) {
        setIsNoiseFilterPending(true);
        micPublication?.track
          ?.setProcessor(krispProcessor)
          .then(() => krispProcessor.setEnabled(shouldEnable))
          .then(() => {
            setIsNoiseFilterEnabled(true);
          })
          .catch((e: any) => {
            setIsNoiseFilterEnabled(false);
            log.error('Krisp hook: error enabling filter', e);
          })
          .finally(() => {
            setIsNoiseFilterPending(false);
          });
      }
    }
  }, [shouldEnable, micPublication, krispProcessor]);

  return {
    setNoiseFilterEnabled,
    isNoiseFilterEnabled,
    isNoiseFilterPending,
    processor: krispProcessor,
  };
}
