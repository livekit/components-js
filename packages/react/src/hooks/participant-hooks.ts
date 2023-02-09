import * as React from 'react';
import {
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Room,
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
  filters?: IParticipantFilter[];
}

/**
 * The useParticipants hook returns all participants of the current room.
 * It is possible to filter the participants.
 */
export const useParticipants = (options: UseParticipantsOptions = {}) => {
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants({
    filters: options.filters,
  });
  const { localParticipant } = useLocalParticipant();

  React.useEffect(() => {
    const all = [localParticipant, ...remoteParticipants];
    setParticipants(all);
  }, [remoteParticipants, localParticipant]);

  return participants;
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
    return () => listener.unsubscribe();
  }, [localParticipant, observeParticipantMedia]);

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
  filters?: IParticipantFilter[];
}

/**
 * Filter participants by:
 * - speaking (is currently speaking)
 * - viewer (no permissions to publish)
 * - publisher (is actively publishing)
 * - published source
 * - identity
 * - metadata
 * - muted state
 */

export interface IParticipantFilter {
  subscribe: (room: Room, onNeedsUpdate: () => void) => () => void;
  filter: (participants: RemoteParticipant[]) => RemoteParticipant[];
}

export const viewerFilter = (): IParticipantFilter => {
  const filter = (participants: RemoteParticipant[]) => {
    participants.filter((p) => p.permissions?.canSubscribe && !p.permissions.canPublishData);
    return participants;
  };

  const subscribe = (room: Room, onNeedsUpdate: () => void) => {
    room.on(RoomEvent.ParticipantPermissionsChanged, onNeedsUpdate);
    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, onNeedsUpdate);
    };
  };

  return { subscribe, filter };
};

export const metadataFilter = (predicate: (metadata?: string) => boolean): IParticipantFilter => {
  const filter = (participants: RemoteParticipant[]) => {
    participants.filter((p) => predicate(p.metadata));
    return participants;
  };

  const subscribe = (room: Room, onNeedsUpdate: () => void) => {
    room.on(RoomEvent.ParticipantMetadataChanged, onNeedsUpdate);
    return () => {
      room.off(RoomEvent.ParticipantMetadataChanged, onNeedsUpdate);
    };
  };

  return { subscribe, filter };
};

/**
 * The useRemoteParticipants
 */
export const useRemoteParticipants = (options: UseRemoteParticipantsOptions = {}) => {
  const room = useRoomContext();
  const [participants, setParticipants] = React.useState<RemoteParticipant[]>([]);
  const [dirty, setDirty] = React.useState<boolean>(true);

  React.useEffect(() => {
    const unsubs: Array<() => void> = [];
    options.filters?.forEach((filter) => {
      unsubs.push(filter.subscribe(room, () => setDirty(true)));
    });
    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  });

  const filter = React.useCallback(
    (participants: RemoteParticipant[]) => {
      if (options.filters) {
        const filteredParticipants = options.filters?.reduce((d, f) => f.filter(d), participants);
        setParticipants(filteredParticipants);
      }
    },
    [options.filters],
  );

  React.useEffect(() => {
    if (dirty) {
      filter(Array.from(room.participants.values()));
    }
  }, [dirty]);

  React.useEffect(() => {
    const listener = connectedParticipantsObserver(room).subscribe(filter);
    return () => listener.unsubscribe();
  }, [filter, room]);
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
