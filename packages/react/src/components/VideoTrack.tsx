import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes, useRef } from 'react';
import { useParticipantContext } from '../contexts';
import { useParticipantMedia } from './Participant';

export interface VideoTrackProps extends HTMLAttributes<HTMLVideoElement> {
  participant?: Participant;
  source: Track.Source.Camera | Track.Source.ScreenShare;
}

export const VideoTrack = (props: VideoTrackProps) => {
  const participant = props.participant ?? useParticipantContext();

  const cameraEl = useRef<HTMLVideoElement>(null);
  const { elementProps: videoProps } = useParticipantMedia(participant, props.source, cameraEl);

  return (
    <>
      <video ref={cameraEl} {...videoProps}></video>
      {props.children}
    </>
  );
};
