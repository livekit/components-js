import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes, useRef } from 'react';
import { useParticipantContext } from '../../contexts';
import { useParticipantMedia } from './Participant';
import { MediaTrackProps } from './VideoTrack';

export interface AudioTrackProps extends MediaTrackProps<HTMLAudioElement> {
  participant?: Participant;
  source: Track.Source.Microphone;
}

export const AudioTrack = (props: AudioTrackProps) => {
  const participant = props.participant ?? useParticipantContext();

  const microphoneEl = useRef<HTMLVideoElement>(null);
  const { elementProps } = useParticipantMedia(participant, props, microphoneEl);

  return (
    <>
      <audio ref={microphoneEl} {...elementProps}></audio>
      {props.children}
    </>
  );
};
