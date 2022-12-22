import type { Participant, Track, TrackPublication } from 'livekit-client';

export type PinState = {
  pinnedParticipant?: Participant;
  pinnedSource?: Track.Source;
};

export type TrackParticipantPair = {
  track: TrackPublication;
  participant: Participant;
};
