import React, { HTMLAttributes, RefObject, useEffect, useRef, useState, useMemo } from 'react';
import { Participant, Track } from 'livekit-client';
import {
  isLocal,
  ParticipantMediaInterface,
  ParticipantViewInterface,
} from '@livekit/components-core';
import { mergeProps } from '../utils';
import { ParticipantContext } from '../contexts';

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
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mergedProps = useMemo(() => {
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
      setIsSpeaking(participant.isSpeaking);
    });
    return () => subscription?.unsubscribe();
  }, [setupParticipantMediaObserver, element]);

  return { publication, isMuted, isSubscribed, track, mergedProps, isSpeaking };
};

function useParticipantView(props: HTMLAttributes<HTMLDivElement>) {
  const mergedProps = useMemo(() => {
    const { className } = ParticipantViewInterface.setup();
    return mergeProps(props, { className: className });
  }, [props]);
  return { mergedProps };
}

export const ParticipantView = ({ participant, children, ...htmlProps }: ParticipantProps) => {
  if (!participant) {
    throw Error('need to provide a participant');
  }
  const { mergedProps } = useParticipantView(htmlProps);
  const cameraEl = useRef<HTMLVideoElement>(null);
  const audioEl = useRef<HTMLAudioElement>(null);
  const { mergedProps: mergedVideoProps, isMuted: videoIsMuted } = useParticipantMedia(
    participant,
    Track.Source.Camera,
    cameraEl,
  );
  const {
    mergedProps: mergedAudioProps,
    isMuted: audioIsMuted,
    isSpeaking,
  } = useParticipantMedia(participant, Track.Source.Microphone, audioEl);

  return (
    <div
      {...mergedProps}
      data-audio-is-muted={audioIsMuted} // TODO: move data properties into core.
      data-video-is-muted={videoIsMuted}
      data-is-speaking={isSpeaking}
    >
      <video ref={cameraEl} {...mergedVideoProps}>
        <p>child of video</p>
      </video>
      {!isLocal(participant) && <audio ref={audioEl} {...mergedAudioProps}></audio>}
      <ParticipantContext.Provider value={participant}>{children}</ParticipantContext.Provider>
    </div>
  );
};
