import React, { HTMLAttributes, RefObject, useEffect, useState, useMemo } from 'react';
import { Participant, ParticipantEvent, Track, TrackPublication } from 'livekit-client';
import {
  mutedObserver,
  createIsSpeakingObserver,
  setupParticipantView,
  setupMediaTrack,
} from '@livekit/components-core';
import { mergeProps } from '../../utils';
import { useParticipantContext } from '../../contexts';

export interface ParticipantClickEvent {
  participant?: Participant;
  publication?: TrackPublication;
}

export type ParticipantProps = HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
  trackSource?: Track.Source;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
};

export const useMediaTrack = (
  participant: Participant,
  source: Track.Source,
  element?: RefObject<HTMLMediaElement>,
) => {
  const [publication, setPublication] = useState(participant.getTrack(source));
  const [isMuted, setMuted] = useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = useState(publication?.isSubscribed);
  const [track, setTrack] = useState(publication?.track);

  const { className, trackObservable } = useMemo(() => {
    return setupMediaTrack(participant, source);
  }, [participant, source]);

  useEffect(() => {
    const subscription = trackObservable.subscribe((publication) => {
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    });
    return () => subscription?.unsubscribe();
  }, [trackObservable]);

  useEffect(() => {
    if (track) {
      if (element?.current) {
        track.attach(element.current);
      } else {
        track.detach();
      }
    }
  }, [track, element]);

  return { publication, isMuted, isSubscribed, track, elementProps: { className } };
};

function useParticipantView<T extends HTMLAttributes<HTMLElement>>(
  participant: Participant,
  props: T,
) {
  const mergedProps = useMemo(() => {
    const { className } = setupParticipantView();
    return mergeProps(props, { className });
  }, [props]);
  const isCameraMuted = useIsMuted(Track.Source.Camera, participant);
  const isMicrophoneMuted = useIsMuted(Track.Source.Microphone, participant);
  const isSpeaking = useIsSpeaking(participant);
  return {
    elementProps: {
      'data-lk-microphone-muted': isMicrophoneMuted,
      'data-lk-camera-muted': isCameraMuted,
      'data-lk-speaking': isSpeaking,
      ...mergedProps,
    },
  };
}

export function useIsSpeaking(participant?: Participant) {
  const p = participant ?? useParticipantContext();
  const [isSpeaking, setIsSpeaking] = useState(p.isSpeaking);

  useEffect(() => {
    const subscription = createIsSpeakingObserver(p).subscribe(setIsSpeaking);
    return () => subscription.unsubscribe();
  });

  return isSpeaking;
}

export function useIsMuted(source: Track.Source, participant?: Participant) {
  const p = participant ?? useParticipantContext();
  const [isMuted, setIsMuted] = useState(!!p.getTrack(source)?.isMuted);

  useEffect(() => {
    const listener = mutedObserver(p, source).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  });

  return isMuted;
}

export const ParticipantView = ({
  participant,
  children,
  onParticipantClick,
  ...htmlProps
}: ParticipantProps) => {
  const p = participant ?? useParticipantContext();
  const { elementProps } = useParticipantView(p, htmlProps);
  const clickHandler = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    elementProps.onClick?.(evt);
    onParticipantClick?.({ participant: p });
  };

  return (
    <div {...elementProps} onClick={clickHandler}>
      {children}
    </div>
  );
};
