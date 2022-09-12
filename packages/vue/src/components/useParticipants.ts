import { connectedParticipants, observeParticipantEvents } from '@livekit/components-core';
import { LocalParticipant, Participant, ParticipantEvent, Room } from 'livekit-client';
import { ref, watchEffect, unref } from 'vue';
import { useRoomContext } from './useRoom';

export const useRemoteParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
  room?: Room,
) => {
  const currentRoom = room ?? useRoomContext();
  const participants = ref<Participant[]>([]);

  const handleUpdate = (newParticipants: Participant[]) => {
    if (filter) {
      newParticipants = filter(newParticipants);
    }
    participants.value = newParticipants;
  };
  watchEffect((onCleanup) => {
    const unsubscribe = connectedParticipants(currentRoom, handleUpdate);
    onCleanup(() => unsubscribe());
  });
  return participants;
};

export const useParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
  room?: Room,
) => {
  const participants = ref<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants(undefined, room);
  const { localParticipant } = useLocalParticipant(room);

  watchEffect(() => {
    let all = [unref(localParticipant), ...unref(remoteParticipants)];
    if (filter) {
      // @ts-ignore
      all = filter(all);
      console.log('filtered participants', all);
    }
    participants.value = all;
  });

  return participants;
};

export const useLocalParticipant = (room?: Room) => {
  const currentRoom = room ?? useRoomContext();
  const localParticipant = ref(currentRoom.localParticipant);
  const isMicrophoneEnabled = ref(localParticipant.value.isMicrophoneEnabled);
  const isCameraEnabled = ref(localParticipant.value.isMicrophoneEnabled);
  const isScreenShareEnabled = ref(localParticipant.value.isMicrophoneEnabled);

  const handleUpdate = (p: LocalParticipant) => {
    isCameraEnabled.value = p.isCameraEnabled;
    isMicrophoneEnabled.value = p.isMicrophoneEnabled;
    isScreenShareEnabled.value = p.isScreenShareEnabled;
    localParticipant.value = p;
  };
  watchEffect((onCleanup) => {
    const listener = observeParticipantEvents(
      // TODO use track observer instead of participant observer
      currentRoom.localParticipant,
      ParticipantEvent.TrackMuted,
      ParticipantEvent.TrackUnmuted,
      ParticipantEvent.LocalTrackPublished,
      ParticipantEvent.LocalTrackUnpublished,
    ).subscribe((p) => handleUpdate(p as LocalParticipant));
    onCleanup(() => listener.unsubscribe());
  });
  return { localParticipant, isMicrophoneEnabled, isScreenShareEnabled, isCameraEnabled };
};
