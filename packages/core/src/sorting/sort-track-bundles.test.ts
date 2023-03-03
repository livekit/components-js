import { Participant, Track, TrackPublication } from 'livekit-client';
import { describe, test, expect } from 'vitest';
import { sortTrackBundles } from './sort-track-bundles';

describe.concurrent('Test subparts of track participant pair sort.', () => {
  test('Basic tests for sortTrackBundles fn.', () => {
    const trackBundle_A = {
      participant: new Participant('sid_A', 'identity_A'),
      publication: new TrackPublication(Track.Kind.Video, 'id_A', 'name_A'),
    };
    const trackBundle_B = {
      participant: new Participant('sid_A', 'identity_A'),
      publication: new TrackPublication(Track.Kind.Video, 'id_B', 'name_B'),
    };
    const trackBundles = [trackBundle_B, trackBundle_A];
    const sorted = sortTrackBundles(trackBundles);
    expect(sorted.length).toBe(2);
    expect(sorted[0].participant.identity).toBe('identity_A');
  });
});
