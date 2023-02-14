import * as React from 'react';
import {
  LocalParticipant,
  Participant,
  RemoteParticipant,
  RoomEvent,
  Track,
  TrackPublication,
} from 'livekit-client';
import {
  connectedParticipantsObserver,
  activeSpeakerObserver,
  sortParticipantsByVolume,
  createIsSpeakingObserver,
  mutedObserver,
  ParticipantMedia,
  observeParticipantMedia,
  participantPermissionObserver,
  connectedParticipantObserver,
} from '@livekit/components-core';
import { useEnsureParticipant, useRoomContext } from '../context';
import { useObservableState } from '../helper/useObservableState';

export interface UseParticipantsOptions {
  /**
   * To optimize performance, you can use the `updateOnlyOn` property to take control of when the hook updates.
   * By default the hook updates on all relevant RoomEvents to keep the returned participants array up to date.
   */
  updateOnlyOn?: RoomEvent[];
}

/**
 * The useParticipants hook returns all participants (local and remote) of the current room.
 */
export const useParticipants = (options: UseParticipantsOptions = {}) => {
  const { updateOnlyOn } = options;
  const remoteParticipants = useRemoteParticipants({
    updateOnlyOn,
  });
  const { localParticipant } = useLocalParticipant();

  return [localParticipant, ...remoteParticipants];
};

/**
 * The useLocalParticipant hook the state of the local participant.
 */
export const useLocalParticipant = () => {
  const room = useRoomContext();
  const [localParticipant, setLocalParticipant] = React.useState(room.localParticipant);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = React.useState(
    localParticipant.isMicrophoneEnabled,
  );
  const [isCameraEnabled, setIsCameraEnabled] = React.useState(
    localParticipant.isMicrophoneEnabled,
  );
  const [isScreenShareEnabled, setIsScreenShareEnabled] = React.useState(
    localParticipant.isMicrophoneEnabled,
  );
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
    setLocalParticipant(media.participant);
  };
  React.useEffect(() => {
    const listener = observeParticipantMedia(localParticipant).subscribe(handleUpdate);
    // TODO also listen to permission and metadata etc. events
    return () => listener.unsubscribe();
  }, [localParticipant]);

  return {
    isMicrophoneEnabled,
    isScreenShareEnabled,
    isCameraEnabled,
    microphoneTrack,
    cameraTrack,
    localParticipant,
  };
};

export const useRemoteParticipant = (identity: string): RemoteParticipant | undefined => {
  const room = useRoomContext();
  const observable = React.useMemo(
    () => connectedParticipantObserver(room, identity),
    [room, identity],
  );
  const participant = useObservableState(
    observable,
    room.getParticipantByIdentity(identity) as RemoteParticipant | undefined,
  );
  return participant;
};

export interface UseRemoteParticipantsOptions {
  updateOnlyOn?: RoomEvent[];
}

/**
 * The useRemoteParticipants
 */
export const useRemoteParticipants = (options: UseRemoteParticipantsOptions = {}) => {
  const room = useRoomContext();
  const [participants, setParticipants] = React.useState<RemoteParticipant[]>([]);
  const { updateOnlyOn } = options;

  React.useEffect(() => {
    const listener = connectedParticipantsObserver(room, {
      additionalRoomEvents: updateOnlyOn,
    }).subscribe(setParticipants);
    return () => listener.unsubscribe();
  }, [room, updateOnlyOn]);
  return participants;
};

/**
 * The useSpeakingParticipants hook returns the only the active speakers of all participants.
 */
export const useSpeakingParticipants = () => {
  const room = useRoomContext();
  const speakerObserver = React.useMemo(() => activeSpeakerObserver(room), [room]);
  const activeSpeakers = useObservableState(speakerObserver, room.activeSpeakers);
  return activeSpeakers;
};

/**
 * The useSortedParticipants hook returns the only the active speakers of all participants.
 */
export function useSortedParticipants(participants: Array<Participant>) {
  const [sortedParticipants, setSortedParticipants] = React.useState(
    sortParticipantsByVolume(participants),
  );
  const activeSpeakers = useSpeakingParticipants();

  React.useEffect(() => {
    setSortedParticipants(sortParticipantsByVolume(participants));
  }, [activeSpeakers, participants]);
  return sortedParticipants;
}

export function useIsSpeaking(participant?: Participant) {
  const p = useEnsureParticipant(participant);
  const observable = React.useMemo(() => createIsSpeakingObserver(p), [p]);
  const isSpeaking = useObservableState(observable, p.isSpeaking);

  return isSpeaking;
}

export interface UseIsMutedOptions {
  participant?: Participant;
}

export function useIsMuted(source: Track.Source, options: UseIsMutedOptions = {}) {
  const p = useEnsureParticipant(options.participant);
  const [isMuted, setIsMuted] = React.useState(!!p.getTrack(source)?.isMuted);

  React.useEffect(() => {
    const listener = mutedObserver(p, source).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  }, [p, source]);

  return isMuted;
}

export function useLocalParticipantPermissions() {
  const room = useRoomContext();
  const permissionObserver = React.useMemo(
    () => participantPermissionObserver(room.localParticipant),
    [room],
  );

  const permissions = useObservableState(permissionObserver, room.localParticipant.permissions);

  return permissions;
}

export interface UseParticipantPermissionsProps {
  participant?: Participant;
}

export function useParticipantPermissions(options: UseParticipantPermissionsProps = {}) {
  const p = useEnsureParticipant(options.participant);
  const permissionObserver = React.useMemo(() => participantPermissionObserver(p), [p]);
  const permissions = useObservableState(permissionObserver, p.permissions);
  return permissions;
}
