import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes, useRef } from 'react';
import { useParticipantContext } from '../../contexts';
import { LKComponentAttributes } from '../../utils';
import { useParticipantMedia } from './Participant';

export interface MediaTrackProps<T extends HTMLMediaElement = HTMLMediaElement>
  extends Omit<LKComponentAttributes<T>, 'children'> {
  participant?: Participant;
  source: Track.Source;
}

export const MediaTrack = (props: MediaTrackProps) => {
  const participant = props.participant ?? useParticipantContext();

  const mediaEl = useRef<HTMLVideoElement>(null);
  const { elementProps, publication } = useParticipantMedia(participant, props, mediaEl);
  const { onClick, ...htmlProps } = elementProps;

  return (
    <>
      {props.source === Track.Source.Camera || props.source === Track.Source.ScreenShare ? (
        <video
          ref={mediaEl}
          {...htmlProps}
          onClick={(evt) => onClick?.({ ...evt, participant, publication })}
        ></video>
      ) : (
        <audio ref={mediaEl} {...elementProps}></audio>
      )}
    </>
  );
};
