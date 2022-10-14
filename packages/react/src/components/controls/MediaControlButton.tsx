import { observeParticipantMedia, ParticipantMedia, setupToggle } from '@livekit/components-core';
import { LocalParticipant, Room, Track, TrackPublication } from 'livekit-client';
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
import { useObservableState } from '../../utils';

type MediaControlProps = Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> & {
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

  const { toggle, className, pendingObserver, enabledObserver } = useMemo(
    () => setupToggle(source, localParticipant),
    [source, localParticipant],
  );

  const pending = useObservableState(pendingObserver, false);
  const enabled = useObservableState(enabledObserver, !!track?.isEnabled);
  const trackSubscribed = useMemo(
    () => (source === Track.Source.ScreenShare ? true : track?.isSubscribed),
    [track],
  );

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
      'data-lk-enabled': enabled,
      disabled: pending || !trackSubscribed,
      onClick: clickHandler,
    },
  };
};

export const MediaControlButton = (props: MediaControlProps) => {
  const { buttonProps } = useMediaToggle(props);
  return <button {...buttonProps}>{props.children}</button>;
};
