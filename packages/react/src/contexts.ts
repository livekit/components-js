import { PinState } from '@livekit/components-core';
import type { Room, Participant, Track } from 'livekit-client';
import { createContext, useContext, useReducer } from 'react';

export const ParticipantContext = createContext<Participant | undefined>(undefined);

export function useParticipantContext() {
  const participant = useContext(ParticipantContext);
  if (!participant) {
    throw Error('tried to access participant context outside of participant context provider');
  }
  return participant;
}

export function useMaybeParticipantContext() {
  return useContext(ParticipantContext);
}

export const RoomContext = createContext<Room | undefined>(undefined);

export function useRoomContext() {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw Error('tried to access room context outside of livekit room component');
  }
  return ctx;
}

export function useMaybeRoomContext() {
  return useContext(RoomContext);
}

export type PinAction =
  | {
      msg: 'set_pin';
      participant: Participant;
      source: Track.Source;
    }
  | { msg: 'clear_pin' };

type PinContextType = {
  dispatch?: React.Dispatch<PinAction>;
  state?: PinState;
};

export const PinContext = createContext<PinContextType>({});

export function usePinContext() {
  const pinContext = useContext(PinContext);
  if (!pinContext) {
    throw Error('tried to access pin context outside of pin context provider');
  }
  return pinContext;
}

export function useMaybePinContext() {
  return useContext(PinContext);
}
