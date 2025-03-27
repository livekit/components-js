import { Participant, RemoteTrackPublication, Track } from 'livekit-client';
import { describe, it, expect } from 'vitest';
import { isTrackReferencePinned } from './track-reference';
import type { PinState } from './types';
import { TrackInfo } from '@livekit/protocol';

describe('Test isTrackReferencePinned', () => {
  const participantA = new Participant('dummy-participant', 'A_id', 'track_A_name');
  const trackInfoA = new TrackInfo({
    sid: 'track_a_sid',
    name: 'track_A_name',
    muted: false,
  });
  // @ts-expect-error
  const trackA = new RemoteTrackPublication(Track.Kind.Video, trackInfoA, true);
  const participantB = new Participant('participant_B', 'B_id', 'B_name');
  const trackInfoB = new TrackInfo({
    sid: 'track_b_sid',
    name: 'track_B_name',
    muted: false,
  });
  // @ts-expect-error
  const trackB = new RemoteTrackPublication(Track.Kind.Video, trackInfoB, true);
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
