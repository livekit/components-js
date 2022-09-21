import React, { HTMLAttributes, RefObject, useEffect, useState, useMemo } from 'react';
import { Participant, ParticipantEvent, Track } from 'livekit-client';
import {
  participantEventSelector,
  ParticipantMediaInterface,
  ParticipantViewInterface,
  mutedObserver,
} from '@livekit/components-core';
import { enhanceProps, LKComponentAttributes, mergeProps } from '../../utils';
import { ParticipantContext, useParticipantContext } from '../../contexts';
import { MediaTrackProps } from './MediaTrack';

export type ParticipantProps = LKComponentAttributes<HTMLDivElement> & {
  participant?: Participant;
};

export const useParticipantMedia = (
  participant: Participant,
  props: MediaTrackProps,
  element?: RefObject<HTMLMediaElement>,
) => {
  const [publication, setPublication] = useState(participant.getTrack(props.source));
  const [isMuted, setMuted] = useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = useState(publication?.isSubscribed);
  const [track, setTrack] = useState(publication?.track);

  const elementProps = useMemo(() => {
    const { className } = ParticipantMediaInterface.setup(props.source);
    return mergeProps(props, { className });
  }, [props.source]);

  const { setupParticipantMediaObserver } = useMemo(() => {
    return ParticipantMediaInterface.observers;
  }, []);

  useEffect(() => {
    const subscription = setupParticipantMediaObserver(
      participant,
      props.source,
      element?.current,
    ).subscribe(({ publication }) => {
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    });
    return () => subscription?.unsubscribe();
  }, [setupParticipantMediaObserver, element]);

  return { publication, isMuted, isSubscribed, track, elementProps };
};

function useParticipantView(props: ParticipantProps) {
  const mergedProps = useMemo(() => {
    const { className } = ParticipantViewInterface.setup();
    return mergeProps(props, { className: className });
  }, [props]);
  return { mergedProps };
}

export function useIsSpeaking(participant?: Participant) {
  const p = participant ?? useParticipantContext();
  const [isSpeaking, setIsSpeaking] = useState(p.isSpeaking);

  useEffect(() => {
    const listener = participantEventSelector(p, ParticipantEvent.IsSpeakingChanged).subscribe(
      ([speaking]) => setIsSpeaking(speaking),
    );
    return () => listener.unsubscribe();
  });

  return isSpeaking;
}

export function useIsMuted(source: Track.Source, participant?: Participant) {
  const p = participant ?? useParticipantContext();
  const [isMuted, setIsMuted] = useState(p.getTrack(source)?.isMuted);

  useEffect(() => {
    const listener = mutedObserver(p, source).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  });

  return isMuted;
}

export const ParticipantView = (props: ParticipantProps) => {
  const participant = props.participant ?? useParticipantContext();
  const { mergedProps } = useParticipantView(props);
  const { children, ...htmlProps } = mergedProps;
  const isVideoMuted = useIsMuted(Track.Source.Camera, participant);
  const isAudioMuted = useIsMuted(Track.Source.Microphone, participant);
  const isSpeaking = useIsSpeaking(participant);

  return (
    <div
      {...htmlProps}
      data-audio-is-muted={isAudioMuted} // TODO: move data properties into core.
      data-video-is-muted={isVideoMuted}
      data-is-speaking={isSpeaking}
    >
      {children}
    </div>
  );
};
