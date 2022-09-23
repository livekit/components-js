import React, { HTMLAttributes, RefObject, useEffect, useState, useMemo } from 'react';
import { Participant, ParticipantEvent, Track } from 'livekit-client';
import {
  mutedObserver,
  createIsSpeakingObserver,
  setupParticipantView,
  setupMediaTrack,
} from '@livekit/components-core';
import { mergeProps } from '../../utils';
import { useParticipantContext } from '../../contexts';

export type ParticipantProps = HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
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

  const { className, trackObserver } = useMemo(() => {
    return setupMediaTrack(participant, source);
  }, [participant, source]);

  useEffect(() => {
    const subscription = trackObserver.subscribe((publication) => {
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    });
    return () => subscription?.unsubscribe();
  }, [trackObserver]);

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

function useParticipantView(participant: Participant, props: HTMLAttributes<HTMLDivElement>) {
  const mergedProps = useMemo(() => {
    const { className } = setupParticipantView();
    return mergeProps(props, { className: className });
  }, [props]);
  const isVideoMuted = useIsMuted(Track.Source.Camera, participant);
  const isAudioMuted = useIsMuted(Track.Source.Microphone, participant);
  const isSpeaking = useIsSpeaking(participant);
  return {
    elementProps: {
      'data-lk-audio-muted': isAudioMuted,
      'data-lk-video-muted': isVideoMuted,
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

export const ParticipantView = ({ participant, children, ...htmlProps }: ParticipantProps) => {
  const p = participant ?? useParticipantContext();
  const { elementProps } = useParticipantView(p, htmlProps);

  return <div {...elementProps}>{children}</div>;
};
