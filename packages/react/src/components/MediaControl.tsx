import { observeParticipantEvents, toggleMediaSource } from '@livekit/components-core';
import { LocalParticipant, ParticipantEvent, Room, Track } from 'livekit-client';
import React, { HTMLAttributes, MouseEventHandler, useCallback, useEffect, useState } from 'react';
import { useRoomContext } from './LiveKitRoom';

type MediaControlProps = HTMLAttributes<HTMLButtonElement> & {
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

export const useMediaToggle = ({ source, onChange, ...rest }: MediaControlProps) => {
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

  if (rest.className) {
    rest.className += `lk-control-button`;
  }
  const clickHandler: MouseEventHandler<HTMLButtonElement> = (evt) => {
    toggle();
    rest.onClick?.(evt);
  };

  return {
    toggle,
    enabled,
    pending,
    track,
    buttonProps: { ...rest, 'aria-pressed': enabled, disabled: pending, onClick: clickHandler },
  };
};

export const MediaControlButton = (props: MediaControlProps) => {
  const { enabled, buttonProps } = useMediaToggle(props);
  const buttonText = `${enabled ? 'Mute' : 'Unmute'} ${props.source}`;
  return <button {...buttonProps}>{props.children ?? buttonText}</button>;
};
