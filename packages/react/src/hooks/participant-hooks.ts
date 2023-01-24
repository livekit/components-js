import * as React from 'react';
import { LocalParticipant, Participant, Track, TrackPublication } from 'livekit-client';
import {
  connectedParticipantsObserver,
  activeSpeakerObserver,
  sortParticipantsByVolume,
  createIsSpeakingObserver,
  mutedObserver,
  ParticipantMedia,
  observeParticipantMedia,
  ParticipantFilter,
} from '@livekit/components-core';
import { useObservableState } from '../hooks/utiltity-hooks';
import { useEnsureParticipant, useRoomContext } from '../context';

export interface UseParticipantsProps {
  filter?: ParticipantFilter;
  filterDependencies?: Array<unknown>;
}

/**
 * The useParticipants hook returns all participants of the current room.
 * It is possible to filter the participants.
 */
export const useParticipants = (props?: UseParticipantsProps) => {
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants({ filter: undefined });
  const { localParticipant } = useLocalParticipant();
  const filterDependencies = React.useMemo(
    () => props?.filterDependencies ?? [],
    [props?.filterDependencies],
  );

  React.useEffect(() => {
    let all = [localParticipant, ...remoteParticipants];
    if (props?.filter) {
      all = all.filter(props.filter);
    }
    setParticipants(all);
  }, [remoteParticipants, localParticipant, props?.filter, ...filterDependencies]);

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

/**
 * The useRemoteParticipants
 */
export const useRemoteParticipants = ({
  filter,
}: {
  filter?: (participants: Array<Participant>) => Array<Participant>;
}) => {
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
export function useSortedParticipants({ participants }: { participants: Array<Participant> }) {
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
  const [isSpeaking, setIsSpeaking] = React.useState(p.isSpeaking);

  React.useEffect(() => {
    const subscription = createIsSpeakingObserver(p).subscribe(setIsSpeaking);
    return () => subscription.unsubscribe();
  }, [p]);

  return isSpeaking;
}

export interface UseIsMutedProps {
  source: Track.Source;
  participant?: Participant;
}

export function useIsMuted({ source, participant }: UseIsMutedProps) {
  const p = useEnsureParticipant(participant);
  const [isMuted, setIsMuted] = React.useState(!!p.getTrack(source)?.isMuted);

  React.useEffect(() => {
    const listener = mutedObserver(p, source).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  }, [p, source]);

  return isMuted;
}
