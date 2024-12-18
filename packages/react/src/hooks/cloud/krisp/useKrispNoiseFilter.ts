import * as React from 'react';
import { LocalAudioTrack } from 'livekit-client';
import { log } from '@livekit/components-core';
import type { KrispNoiseFilterProcessor, NoiseFilterOptions } from '@livekit/krisp-noise-filter';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useLocalParticipant } from '../../..';

/**
 * @alpha
 */
export interface useKrispNoiseFilterOptions {
  /**
   * by default the hook will use the localParticipant's microphone track publication.
   * You can override this behavior by passing in a target TrackReference here
   */
  trackRef?: TrackReferenceOrPlaceholder;
  filterOptions?: NoiseFilterOptions;
}

/**
 * Enable the Krisp enhanced noise cancellation feature for local audio tracks.
 *
 * @package @livekit/components-react/krisp
 * @remarks This filter requires that you installthe `@livekit/krisp-noise-filter` package and is supported only on [LiveKit Cloud](https://cloud.livekit.io).
 * @beta
 * @example
 * ```tsx
 *   const krisp = useKrispNoiseFilter();
 *   return <input
        type="checkbox"
        onChange={(ev) => krisp.setNoiseFilterEnabled(ev.target.checked)}
        checked={krisp.isNoiseFilterEnabled}
        disabled={krisp.isNoiseFilterPending}
      />
 * ```
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
