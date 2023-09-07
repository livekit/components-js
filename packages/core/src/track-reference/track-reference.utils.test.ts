import { describe, test, expect, expectTypeOf } from 'vitest';
import { mockTrackReferencePlaceholder, mockTrackReferenceSubscribed } from './test-utils';
import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import { isPlaceholderReplacement } from './track-reference.utils';

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

describe('Test if the current TrackReferencePlaceholder can be replaced with the next TrackReference.', () => {
  test.each([
    {
      currentTrackRef: mockTrackReferencePlaceholder('Participant_A', Track.Source.Camera),
      nextTrackRef: mockTrackReferenceSubscribed('Participant_A', Track.Source.Camera, {
        mockPublication: true,
      }),
      isReplacement: true,
    },
    {
      currentTrackRef: mockTrackReferencePlaceholder('Participant_B', Track.Source.Camera),
      nextTrackRef: mockTrackReferenceSubscribed('Participant_A', Track.Source.Camera, {
        mockPublication: true,
      }),
      isReplacement: false,
    },
    {
      currentTrackRef: mockTrackReferencePlaceholder('Participant_A', Track.Source.ScreenShare),
      nextTrackRef: mockTrackReferenceSubscribed('Participant_A', Track.Source.Camera, {
        mockPublication: true,
      }),
      isReplacement: false,
    },
  ])(
    'Test if the current TrackReference was the placeholder for the next TrackReference.',
    ({ nextTrackRef: trackRef, currentTrackRef: maybePlaceholder, isReplacement }) => {
      const result = isPlaceholderReplacement(maybePlaceholder, trackRef);
      expect(result).toBe(isReplacement);
    },
  );
});
