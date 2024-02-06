import { describe, test, expect, expectTypeOf } from 'vitest';
import { mockTrackReferencePlaceholder, mockTrackReferenceSubscribed } from './test-utils';
import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import { getTrackReferenceId } from './track-reference.utils';

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

describe('Test mockTrackReferencePlaceholder() produces valid id with getTrackReferenceId()', () => {
  test.each([
    {
      participantId: 'participantA',
      trackSource: Track.Source.Camera,
      expected: 'participantA_camera_placeholder',
    },
  ])('mockTrackReferencePlaceholder id', ({ participantId, trackSource, expected }) => {
    const mock = mockTrackReferencePlaceholder(participantId, trackSource);
    const trackRefId = getTrackReferenceId(mock);
    expect(trackRefId.startsWith(participantId));
    expect(trackRefId.endsWith('_placeholder'));
    expect(trackRefId).toBe(expected);
  });
});

describe('Test mockTrackReferenceSubscribed() produces valid id with getTrackReferenceId()', () => {
  test.each([
    {
      participantId: 'participantA',
      trackSource: Track.Source.Camera,
      expected: 'participantA_camera_publicationId(participantA)',
    },
  ])('mockTrackReferencePlaceholder id', ({ participantId, trackSource, expected }) => {
    const mock = mockTrackReferenceSubscribed(participantId, trackSource, {
      mockPublication: true,
    });
    const trackRefId = getTrackReferenceId(mock);
    expect(trackRefId.startsWith(participantId));
    expect(trackRefId).toBe(expected);
  });
});
