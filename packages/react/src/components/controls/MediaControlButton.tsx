import {
  observeParticipantMedia,
  ParticipantMedia,
  setupManualToggle,
  setupMediaToggle,
} from '@livekit/components-core';
import { LocalParticipant, Room, Track, TrackPublication, ConnectionState } from 'livekit-client';
import React, {
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { mergeProps } from 'react-aria';
import { useMaybeRoomContext, useRoomContext } from '../../contexts';
import { useObservableState } from '../../utils';
import { useConnectionState } from '../ConnectionState';

type MediaControlProps = Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  source: Track.Source;
  initialState?: boolean;
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

export const useMediaToggle = ({ source, onChange, initialState, ...rest }: MediaControlProps) => {
  const room = useMaybeRoomContext();
  const track = room?.localParticipant?.getTrack(source);

  const { toggle, className, pendingObserver, enabledObserver } = useMemo(
    () => (room ? setupMediaToggle(source, room) : setupManualToggle(!!initialState)),
    [source, room],
  );

  const pending = useObservableState(pendingObserver, false);
  const enabled = useObservableState(enabledObserver, !!track?.isEnabled);

  useEffect(() => {
    onChange?.(enabled);
  }, [enabled]);

  const newProps = useMemo(() => mergeProps(rest, { className }), [rest, className]);

  const clickHandler: MouseEventHandler<HTMLButtonElement> = useCallback(
    (evt) => {
      toggle();
      rest.onClick?.(evt);
    },
    [rest, toggle],
  );

  return {
    toggle,
    enabled,
    pending,
    track,
    buttonProps: {
      ...newProps,
      'aria-pressed': enabled,
      'data-lk-source': source,
      'data-lk-enabled': enabled,
      disabled: pending,
      onClick: clickHandler,
    },
  };
};

export const MediaControlButton = (props: MediaControlProps) => {
  const { buttonProps } = useMediaToggle(props);
  return <button {...buttonProps}>{props.children}</button>;
};
