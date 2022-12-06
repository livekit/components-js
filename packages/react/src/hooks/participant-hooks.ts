import * as React from 'react';
import { Participant, Track } from 'livekit-client';
import { useLocalParticipant } from '../components/controls/MediaControlButton';
import {
  connectedParticipantsObserver,
  activeSpeakerObserver,
  sortParticipantsByVolume,
  createIsSpeakingObserver,
  mutedObserver,
} from '@livekit/components-core';
import { useObservableState } from '../utils';
import { useEnsureParticipant, useRoomContext } from '../contexts';

/**
 * The useParticipants hook returns all participants of the current room.
 * It is possible to filter the participants.
 */
export const useParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
  filterDependencies: Array<unknown> = [],
) => {
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants(undefined);
  const { localParticipant } = useLocalParticipant();

  React.useEffect(() => {
    let all = [localParticipant, ...remoteParticipants];
    if (filter) {
      all = filter(all);
    }
    setParticipants(all);
  }, [remoteParticipants, localParticipant, filter, ...filterDependencies]);

  return participants;
};

/**
 * The useRemoteParticipants
 */
export const useRemoteParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
) => {
  const room = useRoomContext();
  const [participants, setParticipants] = React.useState<Participant[]>([]);

  const handleUpdate = React.useCallback(
    (participants: Participant[]) => {
      if (filter) {
        participants = filter(participants);
      }
      setParticipants(participants);
    },
    [filter],
  );
  React.useEffect(() => {
    const listener = connectedParticipantsObserver(room).subscribe(handleUpdate);
    return () => listener.unsubscribe();
  }, [handleUpdate, room]);
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
export const useSortedParticipants = (participants: Array<Participant>) => {
  const [sortedParticipants, setSortedParticipants] = React.useState(
    sortParticipantsByVolume(participants),
  );
  const activeSpeakers = useSpeakingParticipants();

  React.useEffect(() => {
    setSortedParticipants(sortParticipantsByVolume(participants));
  }, [activeSpeakers, participants]);
  return sortedParticipants;
};

export function useIsSpeaking(participant?: Participant) {
  const p = useEnsureParticipant(participant);
  const [isSpeaking, setIsSpeaking] = React.useState(p.isSpeaking);

  React.useEffect(() => {
    const subscription = createIsSpeakingObserver(p).subscribe(setIsSpeaking);
    return () => subscription.unsubscribe();
  }, [p]);

  return isSpeaking;
}

export function useIsMuted(source: Track.Source, participant?: Participant) {
  const p = useEnsureParticipant(participant);
  const [isMuted, setIsMuted] = React.useState(!!p.getTrack(source)?.isMuted);

  React.useEffect(() => {
    const listener = mutedObserver(p, source).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  }, [p, source]);

  return isMuted;
}
