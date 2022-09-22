import React, { HTMLAttributes, RefObject, useEffect, useState, useMemo } from 'react';
import { Participant, ParticipantEvent, Track } from 'livekit-client';
import {
  participantEventSelector,
  ParticipantMediaInterface,
  ParticipantViewInterface,
} from '@livekit/components-core';
import { mergeProps } from '../../utils';
import { ParticipantContext, useParticipantContext } from '../../contexts';

export type ParticipantProps = HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
};

export const useParticipantMedia = (
  participant: Participant,
  source: Track.Source,
  element?: RefObject<HTMLMediaElement>,
) => {
  const [publication, setPublication] = useState(participant.getTrack(source));
  const [isMuted, setMuted] = useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = useState(publication?.isSubscribed);
  const [track, setTrack] = useState(publication?.track);

  const elementProps = useMemo(() => {
    const { className } = ParticipantMediaInterface.setup(source);
    return mergeProps(undefined, { className });
  }, [source]);

  const { setupParticipantMediaObserver } = useMemo(() => {
    return ParticipantMediaInterface.observers;
  }, []);

  useEffect(() => {
    const subscription = setupParticipantMediaObserver(
      participant,
      source,
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

function useParticipantView(props: HTMLAttributes<HTMLDivElement>) {
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
  const [isMuted, setIsMuted] = useState(p.isSpeaking);

  useEffect(() => {
    const listener = participantEventSelector(p, ParticipantEvent.TrackMuted).subscribe(
      ([publication]) => {
        if (publication.source === source) setIsMuted(publication.isMuted);
      },
    );
    setIsMuted(!!participant?.getTrack(source)?.isMuted);
    return () => listener.unsubscribe();
  });

  return isMuted;
}

export const ParticipantView = ({ participant, children, ...htmlProps }: ParticipantProps) => {
  if (!participant) {
    throw Error('need to provide a participant');
  }
  const { mergedProps } = useParticipantView(htmlProps);
  const isVideoMuted = useIsMuted(Track.Source.Camera, participant);
  const isAudioMuted = useIsMuted(Track.Source.Microphone, participant);
  const isSpeaking = useIsSpeaking(participant);

  return (
    <div
      {...mergedProps}
      data-audio-is-muted={isAudioMuted} // TODO: move data properties into core.
      data-video-is-muted={isVideoMuted}
      data-is-speaking={isSpeaking}
    >
      <ParticipantContext.Provider value={participant}>{children}</ParticipantContext.Provider>
    </div>
  );
};
