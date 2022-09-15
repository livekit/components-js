import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes, useRef } from 'react';
import { useParticipantContext } from '../../contexts';
import { useParticipantMedia } from './Participant';

export interface AudioTrackProps extends HTMLAttributes<HTMLVideoElement> {
  participant?: Participant;
  source: Track.Source.Microphone;
}

export const AudioTrack = (props: AudioTrackProps) => {
  const participant = props.participant ?? useParticipantContext();

  const microphoneEl = useRef<HTMLVideoElement>(null);
  const { elementProps } = useParticipantMedia(participant, props.source, microphoneEl);

  return (
    <>
      <audio ref={microphoneEl} {...elementProps}></audio>
      {props.children}
    </>
  );
};
