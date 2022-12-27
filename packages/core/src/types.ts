import type { Participant, TrackPublication } from 'livekit-client';

export type TrackParticipantPair = {
  track: TrackPublication;
  participant: Participant;
};

export type PinState = Array<TrackParticipantPair>;
