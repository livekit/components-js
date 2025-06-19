import type { ParticipantMedia } from '@livekit/components-core';
import { observeParticipantMedia } from '@livekit/components-core';
import type { TrackPublication, LocalParticipant, Room } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../context';

/** @public */
export interface UseLocalParticipantOptions {
  /**
   * The room to use. If not provided, the hook will use the room from the context.
   */
  room?: Room;
}

/**
 * The `useLocalParticipant` hook returns the local participant and the associated state
 * around the participant.
 *
 * @example
 * ```tsx
 * const { localParticipant } = useLocalParticipant();
 * ```
 * @public
 */
export function useLocalParticipant(options: UseLocalParticipantOptions = {}) {
  const room = useEnsureRoom(options.room);
  const [localParticipant, setLocalParticipant] = React.useState(room.localParticipant);

  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = React.useState(
    localParticipant.isMicrophoneEnabled,
  );
  const [isCameraEnabled, setIsCameraEnabled] = React.useState(localParticipant.isCameraEnabled);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = React.useState(
    localParticipant.isScreenShareEnabled,
  );

  const [lastMicrophoneError, setLastMicrophoneError] = React.useState(
    localParticipant.lastMicrophoneError,
  );
  const [lastCameraError, setLastCameraError] = React.useState(localParticipant.lastCameraError);

  const [microphoneTrack, setMicrophoneTrack] = React.useState<TrackPublication | undefined>(
    undefined,
  );
  const [cameraTrack, setCameraTrack] = React.useState<TrackPublication | undefined>(undefined);

  const handleUpdate = (media: ParticipantMedia<LocalParticipant>) => {
    setIsCameraEnabled(media.isCameraEnabled);
    setIsMicrophoneEnabled(media.isMicrophoneEnabled);
    setIsScreenShareEnabled(media.isScreenShareEnabled);
    setCameraTrack(media.cameraTrack);
    setMicrophoneTrack(media.microphoneTrack);
    setLastMicrophoneError(media.participant.lastMicrophoneError);
    setLastCameraError(media.participant.lastCameraError);
    setLocalParticipant(media.participant);
  };
  React.useEffect(() => {
    const listener = observeParticipantMedia(room.localParticipant).subscribe(handleUpdate);
    // TODO also listen to permission and metadata etc. events
    return () => listener.unsubscribe();
  }, [room]);

  return {
    isMicrophoneEnabled,
    isScreenShareEnabled,
    isCameraEnabled,
    microphoneTrack,
    cameraTrack,
    lastMicrophoneError,
    lastCameraError,
    localParticipant,
  };
}
