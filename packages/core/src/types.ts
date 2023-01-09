import type { Participant, TrackPublication } from 'livekit-client';

export type TrackParticipantPair = {
  track: TrackPublication;
  participant: Participant;
};

export type PinState = Array<TrackParticipantPair>;
export type ChatContextState = {
  showChat: boolean;
};
export const CHAT_CONTEXT_DEFAULT_STATE: ChatContextState = { showChat: false };
