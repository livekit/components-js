import { Track } from 'livekit-client';
import React, { ReactNode, useRef } from 'react';
import { useRoom } from './RoomProvider';

type MediaControlProps = {
  children?: ReactNode | ReactNode[];
  type: Track.Source;
  onChange?: (enabled: boolean) => void;
};

export const TrackSource = Track.Source;

export const MediaControlButton = ({ type, children, onChange }: MediaControlProps) => {
  const roomState = useRoom();
  const buttonEl = useRef<HTMLButtonElement | null>(null);
  const buttonText = `Toggle ${type}`;
  const handleClick = async () => {
    const { localParticipant } = roomState.room;
    if (localParticipant) {
      let isMediaEnabled = false;
      if (buttonEl.current) {
        buttonEl.current.disabled = true;
      }
      try {
        switch (type) {
          case Track.Source.Camera:
            await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
            isMediaEnabled = localParticipant.isCameraEnabled;
            break;
          case Track.Source.Microphone:
            await localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled);
            isMediaEnabled = localParticipant.isMicrophoneEnabled;
            break;
          case Track.Source.ScreenShare:
            await localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled);
            isMediaEnabled = localParticipant.isScreenShareEnabled;
            break;
          default:
            break;
        }
      } finally {
        if (buttonEl.current) {
          buttonEl.current.disabled = false;
        }
        if (onChange) {
          onChange(isMediaEnabled);
        }
      }
    }
  };
  return (
    <button ref={buttonEl} onClick={handleClick}>
      {children ?? buttonText}
    </button>
  );
};
