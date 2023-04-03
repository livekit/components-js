import { Participant, Track, TrackPublication } from 'livekit-client';
import { describe, it, expect } from 'vitest';
import { isTrackReferencePinned } from './track-reference';
import type { PinState } from './types';

describe('Test isTrackReferencePinned', () => {
  const participantA = new Participant('dummy-participant', 'A_id', 'track_A_name');
  const trackA = new TrackPublication(Track.Kind.Video, 'track_A_id', 'track_A_name');
  trackA.trackSid = 'track_a_sid';
  const participantB = new Participant('participant_B', 'B_id', 'B_name');
  const trackB = new TrackPublication(Track.Kind.Video, 'track_B_id', 'track_B_name');
  trackB.trackSid = 'track_b_sid';
  const trackReferenceA = {
    participant: participantA,
    source: Track.Source.Camera,
    publication: trackA,
  };
  const trackReferenceB = {
    participant: participantB,
    source: Track.Source.Camera,
    publication: trackB,
  };
  const trackReferenceC = {
    participant: participantB,
    source: Track.Source.Camera,
    publication: trackA,
  };

  it('If the TrackReference is in the pin state the function should always return true.', () => {
    const pinState: PinState = [trackReferenceA];
    expect(isTrackReferencePinned(trackReferenceA, pinState)).toBe(true);

    const pinState2: PinState = [trackReferenceA, trackReferenceB, trackReferenceC];
    expect(isTrackReferencePinned(trackReferenceA, pinState2)).toBe(true);
  });

  it('If the TrackReference is not in the pin state the function should return false.', () => {
    const pinState: PinState = [trackReferenceB, trackReferenceC];
    expect(isTrackReferencePinned(trackReferenceA, pinState)).toBe(false);
  });

  it('Empty pin state should always return false.', () => {
    const pinState: PinState = [];
    expect(isTrackReferencePinned(trackReferenceA, pinState)).toBe(false);
    expect(isTrackReferencePinned(trackReferenceB, pinState)).toBe(false);
  });
});
