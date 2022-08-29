import { observeParticipantEvents, toggleMediaSource } from '@livekit/auth-helpers-shared';
import { LocalParticipant, ParticipantEvent, Room, Track } from 'livekit-client';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
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

  const onEnableChange = (isEnabled: boolean) => {
    setEnabled(isEnabled);
    onChange?.(isEnabled);
  };

  const toggle = useCallback(
    () => toggleMediaSource(source, localParticipant, onEnableChange, setPending),
    [localParticipant, source],
  );

  return { toggle, enabled, pending, track };
};

export const MediaToggle = ({ source, children, onChange }: MediaControlProps) => {
  const { toggle, enabled, pending } = useMediaToggle(source, onChange);
  const buttonText = `${enabled ? 'Mute' : 'Unmute'} ${source}`;

  return (
    <button onClick={toggle} disabled={pending} aria-pressed={enabled}>
      {children ?? buttonText}
    </button>
  );
};

export MediaControlButton = () => {
  return <>
  <MediaToggle />
  <MediaSelect/> 
  </>
}
