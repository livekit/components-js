import { observeParticipantEvents, setupToggle } from '@livekit/components-core';
import { LocalParticipant, ParticipantEvent, Room, Track } from 'livekit-client';
import React, {
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { mergeProps } from 'react-aria';
import { useRoomContext } from '../contexts';

type MediaControlProps = HTMLAttributes<HTMLButtonElement> & {
  source: Track.Source;
  onChange?: (enabled: boolean) => void;
};

export const TrackSource = Track.Source;

export const useLocalParticipant = (room?: Room) => {
  const currentRoom = room ?? useRoomContext();
  const [localParticipant, setLocalParticipant] = useState(currentRoom.localParticipant);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(
    localParticipant.isMicrophoneEnabled,
  );
  const [isCameraEnabled, setIsCameraEnabled] = useState(localParticipant.isMicrophoneEnabled);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(
    localParticipant.isMicrophoneEnabled,
  );

  const handleUpdate = (p: LocalParticipant) => {
    setIsCameraEnabled(p.isCameraEnabled);
    setIsMicrophoneEnabled(p.isMicrophoneEnabled);
    setIsScreenShareEnabled(p.isScreenShareEnabled);
    setLocalParticipant(p);
  };
  useEffect(() => {
    const listener = observeParticipantEvents(
      // TODO use track observer instead of participant observer
      currentRoom.localParticipant,
      ParticipantEvent.TrackMuted,
      ParticipantEvent.TrackUnmuted,
      ParticipantEvent.LocalTrackPublished,
      ParticipantEvent.LocalTrackUnpublished,
    ).subscribe((p) => handleUpdate(p as LocalParticipant));
    return () => listener.unsubscribe();
  });
  return { localParticipant, isMicrophoneEnabled, isScreenShareEnabled, isCameraEnabled };
};

export const useMediaToggle = ({ source, onChange, ...rest }: MediaControlProps) => {
  const { localParticipant } = useLocalParticipant();
  const track = localParticipant.getTrack(source);
  const [enabled, setEnabled] = useState(!!track?.isEnabled);
  const [pending, setPending] = useState(false);

  const onEnableChange = (isEnabled: boolean) => {
    setEnabled(isEnabled);
    onChange?.(isEnabled);
  };

  const { toggle, className, observers } = useMemo(() => setupToggle(), []);

  const handleToggle = useCallback(
    () => toggle(source, localParticipant),
    [localParticipant, source],
  );

  useEffect(() => {
    const listeners: Array<any> = [];
    listeners.push(observers.enabledObserver(source, localParticipant).subscribe(onEnableChange));
    listeners.push(observers.pendingObserver.subscribe(setPending));

    return () => listeners.forEach((l) => l.unsubscribe());
  }, [source, localParticipant]);

  const newProps = useMemo(() => mergeProps(rest, { className }), [rest, className]);

  const clickHandler: MouseEventHandler<HTMLButtonElement> = useCallback(
    (evt) => {
      handleToggle();
      rest.onClick?.(evt);
    },
    [rest, handleToggle],
  );

  return {
    toggle: handleToggle,
    enabled,
    pending,
    track,
    buttonProps: { ...newProps, 'aria-pressed': enabled, disabled: pending, onClick: clickHandler },
  };
};

export const MediaControlButton = (props: MediaControlProps) => {
  const { enabled, buttonProps } = useMediaToggle(props);
  const buttonText = `${enabled ? 'Mute' : 'Unmute'} ${props.source}`;
  return <button {...buttonProps}>{props.children ?? buttonText}</button>;
};
