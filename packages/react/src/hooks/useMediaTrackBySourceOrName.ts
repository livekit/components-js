import type { TrackIdentifier } from '@livekit/components-core';
import {
  getTrackByIdentifier,
  isTrackReference,
  log,
  setupMediaTrack,
} from '@livekit/components-core';
import * as React from 'react';
import { mergeProps } from '../utils';

/** @public */
export interface UseMediaTrackOptions {
  element?: React.RefObject<HTMLMediaElement> | null;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

/**
 * @internal
 */
export function useMediaTrackBySourceOrName(
  observerOptions: TrackIdentifier,
  options: UseMediaTrackOptions = {},
) {
  const [publication, setPublication] = React.useState(getTrackByIdentifier(observerOptions));

  const [isMuted, setMuted] = React.useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = React.useState(publication?.isSubscribed);

  const [track, setTrack] = React.useState(publication?.track);
  const [orientation, setOrientation] = React.useState<'landscape' | 'portrait'>('landscape');
  const previousElement = React.useRef<HTMLMediaElement | undefined | null>();

  const { className, trackObserver } = React.useMemo(() => {
    return setupMediaTrack(observerOptions);
  }, [
    observerOptions.participant.sid ?? observerOptions.participant.identity,
    observerOptions.source,
    isTrackReference(observerOptions) && observerOptions.publication.trackSid,
  ]);

  React.useEffect(() => {
    const subscription = trackObserver.subscribe((publication) => {
      log.debug('update track', publication);
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    });
    return () => subscription?.unsubscribe();
  }, [trackObserver]);

  React.useEffect(() => {
    if (track) {
      if (previousElement.current) {
        track.detach(previousElement.current);
      }
      if (
        options.element?.current &&
        !(observerOptions.participant.isLocal && track?.kind === 'audio')
      ) {
        track.attach(options.element.current);
      }
    }
    previousElement.current = options.element?.current;
    return () => {
      if (previousElement.current) {
        track?.detach(previousElement.current);
      }
    };
  }, [track, options.element]);

  React.useEffect(() => {
    // Set the orientation of the video track.
    // TODO: This does not handle changes in orientation after a track got published (e.g when rotating a phone camera from portrait to landscape).
    if (
      typeof publication?.dimensions?.width === 'number' &&
      typeof publication?.dimensions?.height === 'number'
    ) {
      const orientation_ =
        publication.dimensions.width > publication.dimensions.height ? 'landscape' : 'portrait';
      setOrientation(orientation_);
    }
  }, [publication]);

  return {
    publication,
    isMuted,
    isSubscribed,
    track,
    elementProps: mergeProps(options.props, {
      className,
      'data-lk-local-participant': observerOptions.participant.isLocal,
      'data-lk-source': publication?.source,
      ...(publication?.kind === 'video' && { 'data-lk-orientation': orientation }),
    }),
  };
}
