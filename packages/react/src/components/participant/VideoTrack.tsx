import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes, useRef } from 'react';
import { useParticipantContext } from '../../contexts';
import { LKComponentAttributes } from '../../utils';
import { useParticipantMedia } from './Participant';

export interface MediaTrackProps<T extends HTMLMediaElement = HTMLMediaElement>
  extends LKComponentAttributes<T> {
  participant?: Participant;
  source: Track.Source;
}
export interface VideoTrackProps extends MediaTrackProps {
  participant?: Participant;
  source: Track.Source.Camera | Track.Source.ScreenShare;
}

export const VideoTrack = (props: VideoTrackProps) => {
  const participant = props.participant ?? useParticipantContext();

  const cameraEl = useRef<HTMLVideoElement>(null);
  const { elementProps, publication } = useParticipantMedia(participant, props, cameraEl);
  const { onClick, ...videoProps } = elementProps;

  return (
    <>
      <video
        ref={cameraEl}
        {...videoProps}
        onClick={(evt) => onClick?.({ ...evt, participant, publication })}
      ></video>
      {props.children}
    </>
  );
};
