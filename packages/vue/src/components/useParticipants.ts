import { connectedParticipantsObserver, observeParticipantEvents } from '@livekit/components-core';
import { LocalParticipant, Participant, ParticipantEvent, Room } from 'livekit-client';
import { ref, watchEffect, unref } from 'vue';
import { useRoomContext } from './useRoom';

export const useRemoteParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
) => {
  const room = useRoomContext();
  const participants = ref<Participant[]>([]);

  const handleUpdate = (newParticipants: Participant[]) => {
    if (filter) {
      newParticipants = filter(newParticipants);
    }
    participants.value = newParticipants;
  };
  watchEffect((onCleanup) => {
    const listener = connectedParticipantsObserver(room).subscribe(handleUpdate);
    onCleanup(() => listener.unsubscribe());
  });
  return participants;
};

export const useParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
) => {
  const participants = ref<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants(undefined);
  const { localParticipant } = useLocalParticipant();

  watchEffect(() => {
    let all = [unref(localParticipant), ...unref(remoteParticipants)];
    if (filter) {
      // @ts-ignore
      all = filter(all);
    }
    participants.value = all;
  });

  return participants;
};

export const useLocalParticipant = () => {
  const room = useRoomContext();
  const localParticipant = ref(room.localParticipant);
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
      room.localParticipant,
      ParticipantEvent.TrackMuted,
      ParticipantEvent.TrackUnmuted,
      ParticipantEvent.LocalTrackPublished,
      ParticipantEvent.LocalTrackUnpublished,
    ).subscribe((p) => handleUpdate(p as LocalParticipant));
    onCleanup(() => listener.unsubscribe());
  });
  return { localParticipant, isMicrophoneEnabled, isScreenShareEnabled, isCameraEnabled };
};
