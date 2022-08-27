import { observeParticipantEvents } from '@livekit/auth-helpers-shared';
import { LocalParticipant, ParticipantEvent, Room, Track } from 'livekit-client';
import React, { ReactNode, useEffect, useState } from 'react';
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

export const useMediaToggle = (source: Track.Source, onChange?: (enabled: boolean) => void) => {
  const localParticipant = useLocalParticipant();
  const track = localParticipant.getTrack(source);
  const [enabled, setEnabled] = useState(!!track?.isEnabled);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    let isMediaEnabled = false;

    try {
      setPending(true);
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
      setEnabled(isMediaEnabled);
      setPending(false);
      if (onChange) {
        onChange(isMediaEnabled);
      }
    }
  };

  return { toggle, enabled, pending, track };
};

export const MediaControlButton = ({ source, children, onChange }: MediaControlProps) => {
  const { toggle, enabled, pending } = useMediaToggle(source, onChange);
  const buttonText = `${enabled ? 'Mute' : 'Unmute'} ${source}`;

  return (
    <button onClick={toggle} disabled={pending}>
      {children ?? buttonText}
    </button>
  );
};
