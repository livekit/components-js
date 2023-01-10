import { Participant, Track, TrackPublication } from 'livekit-client';
import { describe, it, expect } from 'vitest';
import { PinState, TrackParticipantPair } from './types';
import { isParticipantTrackPinned } from './utils';

describe('Test isParticipantTrackPinned', () => {
  const participantA = new Participant('dummy-participant', 'A_id', 'track_A_name');
  const trackA = new TrackPublication(Track.Kind.Video, 'track_A_id', 'track_A_name');
  const participantB = new Participant('participant_B', 'B_id', 'B_name');
  const trackB = new TrackPublication(Track.Kind.Video, 'track_B_id', 'track_B_name');
  const pairA: TrackParticipantPair = { participant: participantA, track: trackA };
  const pairB: TrackParticipantPair = { participant: participantB, track: trackB };
  const pairC: TrackParticipantPair = { participant: participantB, track: trackA };

  it('If the pair is in the pin state the function should always return true.', () => {
    const pinState: PinState = [pairA];
    expect(isParticipantTrackPinned(pairA, pinState)).toBe(true);

    const pinState2: PinState = [pairA, pairB, pairC];
    expect(isParticipantTrackPinned(pairA, pinState2)).toBe(true);
  });

  it('If the pair is not in the pin state the function should return false.', () => {
    const pinState: PinState = [pairB, pairC];
    expect(isParticipantTrackPinned(pairA, pinState)).toBe(false);
  });

  it('Empty pin state should always return false.', () => {
    const pinState: PinState = [];
    expect(isParticipantTrackPinned(pairA, pinState)).toBe(false);
    expect(isParticipantTrackPinned(pairB, pinState)).toBe(false);
  });
});
