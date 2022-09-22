import {
  observeParticipantEvents,
  observeParticipantMedia,
  ParticipantMedia,
  setupToggle,
} from '@livekit/components-core';
import { LocalParticipant, ParticipantEvent, Room, Track, TrackPublication } from 'livekit-client';
import React, {
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { mergeProps } from 'react-aria';
import { useRoomContext } from '../../contexts';

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
  const [microphoneTrack, setMicrophoneTrack] = useState<TrackPublication | undefined>(undefined);
  const [cameraTrack, setCameraTrack] = useState<TrackPublication | undefined>(undefined);

  const handleUpdate = (media: ParticipantMedia<LocalParticipant>) => {
    setIsCameraEnabled(media.isCameraEnabled);
    setIsMicrophoneEnabled(media.isMicrophoneEnabled);
    setIsScreenShareEnabled(media.isScreenShareEnabled);
    setCameraTrack(media.cameraTrack);
    setMicrophoneTrack(media.microphoneTrack);
    setLocalParticipant(media.participant);
  };
  useEffect(() => {
    const listener = observeParticipantMedia(localParticipant).subscribe(handleUpdate);
    return () => listener.unsubscribe();
  });
  return {
    isMicrophoneEnabled,
    isScreenShareEnabled,
    isCameraEnabled,
    microphoneTrack,
    cameraTrack,
    localParticipant,
  };
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

  const { toggle, className, pendingObserver, enabledObserver } = useMemo(() => setupToggle(), []);

  const handleToggle = useCallback(
    () => toggle(source, localParticipant),
    [localParticipant, source],
  );

  useEffect(() => {
    const listeners: Array<any> = [];
    listeners.push(enabledObserver(source, localParticipant).subscribe(onEnableChange));
    listeners.push(pendingObserver.subscribe(setPending));

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
