import { Participant, Track, TrackPublication } from 'livekit-client';
import { describe, it, expect } from 'vitest';
import { PinState } from './types';
import { isTrackReferencePinned } from './utils';

describe('Test isTrackReferencePinned', () => {
  const participantA = new Participant('dummy-participant', 'A_id', 'track_A_name');
  const trackA = new TrackPublication(Track.Kind.Video, 'track_A_id', 'track_A_name');
  const participantB = new Participant('participant_B', 'B_id', 'B_name');
  const trackB = new TrackPublication(Track.Kind.Video, 'track_B_id', 'track_B_name');
  const trackBundleA = {
    participant: participantA,
    source: Track.Source.Camera,
    publication: trackA,
  };
  const trackBundleB = {
    participant: participantB,
    source: Track.Source.Camera,
    publication: trackB,
  };
  const trackBundleC = {
    participant: participantB,
    source: Track.Source.Camera,
    publication: trackA,
  };

  it('If the TrackReference is in the pin state the function should always return true.', () => {
    const pinState: PinState = [trackBundleA];
    expect(isTrackReferencePinned(trackBundleA, pinState)).toBe(true);

    const pinState2: PinState = [trackBundleA, trackBundleB, trackBundleC];
    expect(isTrackReferencePinned(trackBundleA, pinState2)).toBe(true);
  });

  it('If the TrackReference is not in the pin state the function should return false.', () => {
    const pinState: PinState = [trackBundleB, trackBundleC];
    expect(isTrackReferencePinned(trackBundleA, pinState)).toBe(false);
  });

  it('Empty pin state should always return false.', () => {
    const pinState: PinState = [];
    expect(isTrackReferencePinned(trackBundleA, pinState)).toBe(false);
    expect(isTrackReferencePinned(trackBundleB, pinState)).toBe(false);
  });
});
