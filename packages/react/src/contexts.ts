import type { Room, Participant, Track } from 'livekit-client';
import { createContext, useContext } from 'react';

const ParticipantContext = createContext<Participant | undefined>(undefined);

function useParticipantContext() {
  const participant = useContext(ParticipantContext);
  if (!participant) {
    throw Error('tried to access participant context outside of participant context provider');
  }
  return participant;
}

function useMaybeParticipantContext() {
  return useContext(ParticipantContext);
}

const RoomContext = createContext<Room | undefined>(undefined);

function useRoomContext() {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw Error('tried to access room context outside of livekit room component');
  }
  return ctx;
}

function useMaybeRoomContext() {
  return useContext(RoomContext);
}

type FocusViewState = {
  focusParticipant?: Participant;
  focusTrackSource?: Track.Source;
  others?: Array<Participant>;
  showPiP?: boolean;
};

const FocusViewContext = createContext<FocusViewState | undefined>(undefined);

function useMaybeFocusViewContext() {
  const ctx = useContext(FocusViewContext);
  return ctx;
}

export {
  RoomContext,
  useRoomContext,
  useMaybeRoomContext,
  ParticipantContext,
  useParticipantContext,
  useMaybeParticipantContext,
  FocusViewContext,
  useMaybeFocusViewContext,
  FocusViewState,
};
