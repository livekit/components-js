import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../../contexts';
import { ParticipantClickEvent, useMediaTrack } from './Participant';

export interface MediaTrackProps<T extends HTMLMediaElement = HTMLMediaElement>
  extends Omit<React.HTMLAttributes<T>, 'children'> {
  participant?: Participant;
  source: Track.Source;
  onTrackClick?: (evt: ParticipantClickEvent) => void;
}

export const MediaTrack = ({ onTrackClick, onClick, ...props }: MediaTrackProps) => {
  const participant = useEnsureParticipant(props.participant);

  const mediaEl = React.useRef<HTMLVideoElement>(null);
  const { elementProps, publication } = useMediaTrack(participant, props.source, mediaEl, props);

  const clickHandler = (evt: React.MouseEvent<HTMLMediaElement, MouseEvent>) => {
    onClick?.(evt);
    onTrackClick?.({ participant, publication });
  };

  return (
    <>
      {props.source === Track.Source.Camera || props.source === Track.Source.ScreenShare ? (
        <video ref={mediaEl} {...elementProps} muted={true} onClick={clickHandler}></video>
      ) : (
        <audio ref={mediaEl} {...elementProps}></audio>
      )}
    </>
  );
};
