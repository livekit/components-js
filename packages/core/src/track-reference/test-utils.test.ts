import { describe, test, expect, expectTypeOf } from 'vitest';
import { mockTrackReferenceSubscribed } from './test-utils';
import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';

describe('Test mocking functions ', () => {
  test('mockTrackReferenceSubscribed without options.', () => {
    const mock = mockTrackReferenceSubscribed('MOCK_ID', Track.Source.Camera);
    expect(mock).toBeDefined();
    // Check if the participant is mocked correctly:
    expect(mock.participant).toBeDefined();
    expect(mock.participant.identity).toBe('MOCK_ID');
    expectTypeOf(mock.participant).toMatchTypeOf<Participant>();

    // Check if the publication is mocked correctly:
    expect(mock.publication).toBeDefined();
    expect(mock.publication.kind).toBe(Track.Kind.Video);
    expectTypeOf(mock.publication).toMatchTypeOf<TrackPublication>();

    // Check if the source is mocked correctly:
    expect(mock.source).toBeDefined();
    expect(mock.source).toBe(Track.Source.Camera);
    expectTypeOf(mock.source).toMatchTypeOf<Track.Source>();
  });
});
