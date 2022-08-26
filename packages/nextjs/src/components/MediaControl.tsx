import { observeParticipantEvents } from '@livekit/auth-helpers-shared';
import { LocalParticipant, ParticipantEvent, Room, Track } from 'livekit-client';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useRoomContext } from './LiveKitRoom';

type MediaControlProps = {
  children?: ReactNode | ReactNode[];
  source: Track.Source;
  onChange?: (enabled: boolean) => void;
};

export const TrackSource = Track.Source;

export const useLocalParticipant = (room?: Room) => {
  const currentRoom = room ?? useRoomContext();
  const [localParticipant, setLocalParticipant] = useState(currentRoom.localParticipant);
  useEffect(() => {
    const listener = observeParticipantEvents(
      // TODO use track observer instead of participant observer
      currentRoom.localParticipant,
      ParticipantEvent.TrackMuted,
      ParticipantEvent.TrackUnmuted,
      ParticipantEvent.LocalTrackPublished,
      ParticipantEvent.LocalTrackUnpublished,
    ).subscribe((p) => setLocalParticipant(p as LocalParticipant));
    return () => listener.unsubscribe();
  });
  return localParticipant;
};

export const MediaControlButton = ({ source, children, onChange }: MediaControlProps) => {
  const localParticipant = useLocalParticipant();
  const buttonEl = useRef<HTMLButtonElement | null>(null);
  const buttonText = `Toggle ${source}`;
  const handleClick = async () => {
    if (localParticipant) {
      let isMediaEnabled = false;
      if (buttonEl.current) {
        buttonEl.current.disabled = true;
      }
      try {
        switch (source) {
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
