import type { Participant, Track } from 'livekit-client';

export type PinState = {
  pinnedParticipant?: Participant;
  pinnedSource?: Track.Source;
};
