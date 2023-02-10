import * as React from 'react';
import {
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Room,
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
  IParticipantFilter,
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
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  React.useEffect(() => {
    const all = [localParticipant, ...remoteParticipants];
    setParticipants(all);
  }, [remoteParticipants, localParticipant]);

  const filteredParticipants = useParticipantsFilter(room, participants, options.filters);

  return filteredParticipants;
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

const useParticipantsFilter = <T extends Participant>(
  room: Room,
  participants: T[],
  filters?: IParticipantFilter[],
) => {
  const [filteredParticipants, setFilteredParticipants] = React.useState(participants);
  const [dirty, setDirty] = React.useState<boolean>(true);

  React.useEffect(() => {
    const unsubs: Array<() => void> = [];
    filters?.forEach((filter) => {
      if (filter.subscribe) {
        unsubs.push(filter.subscribe(room, () => setDirty(true)));
      }
    });
    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [filters, room]);

  const filter = React.useCallback(
    (ps: T[]) => {
      if (filters) {
        console.log('applying filters', filters, ps);
        const filteredParticipants = filters.reduce((d, f) => {
          console.log('current value', d);
          const filtered = f.filter(d);
          console.log('new value', filtered);
          return filtered;
        }, ps);
        console.log(
          'filtered',
          filteredParticipants,
          filteredParticipants.some((p) => p.isScreenShareEnabled),
        );
        setFilteredParticipants(filteredParticipants);
      } else {
        console.log('setting ps without filter', ps);
        setFilteredParticipants(ps);
      }
    },
    [filters],
  );

  React.useEffect(() => {
    console.log('reapplying filter');
    filter(participants);
    if (dirty) {
      setDirty(false);
    }
  }, [dirty, participants, filter]);

  return filteredParticipants;
};

/**
 * The useRemoteParticipants
 */
export const useRemoteParticipants = (options: UseParticipantsOptions = {}) => {
  const room = useRoomContext();
  const [participants, setParticipants] = React.useState<RemoteParticipant[]>([]);

  const filteredParticipants = useParticipantsFilter(room, participants, options.filters);

  React.useEffect(() => {
    const listener = connectedParticipantsObserver(room).subscribe(setParticipants);
    return () => listener.unsubscribe();
  }, [room]);

  return filteredParticipants;
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
