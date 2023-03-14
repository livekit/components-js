import { TrackObserverOptions, setupMediaTrack, log, isLocal } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import React from 'react';
import { useEnsureParticipant } from '../context';
import { mergeProps } from '../utils';

export interface UseMediaTrackOptions {
  participant?: Participant;
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

/**
 * @internal
 */
export function useMediaTrackBySourceOrName(
  { source, name }: TrackObserverOptions,
  options: UseMediaTrackOptions = {},
) {
  const participant = useEnsureParticipant(options.participant);
  const [publication, setPublication] = React.useState(
    source ? participant.getTrack(source) : participant.getTrackByName(name),
  );
  const [isMuted, setMuted] = React.useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = React.useState(publication?.isSubscribed);
  const [track, setTrack] = React.useState(publication?.track);
  const [orientation, setOrientation] = React.useState<'landscape' | 'portrait'>('landscape');
  const previousElement = React.useRef<HTMLMediaElement | undefined | null>();

  const { className, trackObserver } = React.useMemo(() => {
    return setupMediaTrack(participant, source ? { source } : { name });
  }, [participant, source, name]);

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
      if (options.element?.current && !(isLocal(participant) && track?.kind === 'audio')) {
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
      'data-lk-local-participant': participant.isLocal,
      'data-lk-source': source,
      ...(source === Track.Source.Camera || source === Track.Source.ScreenShare
        ? { 'data-lk-orientation': orientation }
        : {}),
    }),
  };
}
