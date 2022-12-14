import { setupMediaTrack, trackObservable } from '@livekit/components-core';
import { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { mergeProps } from '../utils';

interface UseMediaTrackProps {
  participant: Participant;
  source: Track.Source;
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

export const useMediaTrack = ({ participant, source, element, props }: UseMediaTrackProps) => {
  const [publication, setPublication] = React.useState(participant.getTrack(source));
  const [isMuted, setMuted] = React.useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = React.useState(publication?.isSubscribed);
  const [track, setTrack] = React.useState(publication?.track);
  const previousElement = React.useRef<HTMLMediaElement | undefined | null>();

  const { className, trackObserver } = React.useMemo(() => {
    return setupMediaTrack(participant, source);
  }, [participant, source]);

  React.useEffect(() => {
    const subscription = trackObserver.subscribe((publication) => {
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
      if (element?.current) {
        track.attach(element.current);
      }
    }
    previousElement.current = element?.current;
  }, [track, element]);

  return {
    publication,
    isMuted,
    isSubscribed,
    track,
    elementProps: mergeProps(props, {
      className,
      'data-lk-local-participant': participant.isLocal,
      'data-lk-source': source,
    }),
  };
};

interface UseTrackProps {
  pub?: TrackPublication;
}

export function useTrack({ pub }: UseTrackProps) {
  const [publication, setPublication] = React.useState(pub);
  const [track, setTrack] = React.useState(pub?.track);
  React.useEffect(() => {
    if (!pub) return;
    const listener = trackObservable(pub).subscribe((p) => {
      if (p.track !== track) {
        track?.detach();
      }
      setPublication(p);
      setTrack(p.isSubscribed ? p.track : undefined);
    });
    setTrack(pub?.track);
    setPublication(pub);
    return () => listener.unsubscribe();
  }, [pub, track]);

  return { publication, track };
}
