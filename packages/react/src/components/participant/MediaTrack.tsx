import { Participant, Track } from 'livekit-client';
import React, { useRef } from 'react';
import { useParticipantContext } from '../../contexts';
import { LKComponentAttributes } from '../../utils';
import { useMediaTrack } from './Participant';

export interface MediaTrackProps<T extends HTMLMediaElement = HTMLMediaElement>
  extends Omit<LKComponentAttributes<T>, 'children'> {
  participant?: Participant;
  source: Track.Source;
}

export const MediaTrack = (props: MediaTrackProps) => {
  const participant = props.participant ?? useParticipantContext();

  const mediaEl = useRef<HTMLVideoElement>(null);
  const { elementProps, publication } = useMediaTrack(participant, props.source, mediaEl);

  return (
    <>
      {props.source === Track.Source.Camera || props.source === Track.Source.ScreenShare ? (
        <video
          ref={mediaEl}
          {...elementProps}
          onClick={(evt) => props.onClick?.({ ...evt, participant, publication })}
        ></video>
      ) : (
        <audio ref={mediaEl} {...elementProps}></audio>
      )}
    </>
  );
};
