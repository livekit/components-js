import { Track } from 'livekit-client';
import { describe, test, expect } from 'vitest';
import {
  flatTrackReferenceArray,
  mockTrackReferenceSubscribed,
} from '../track-reference/test-utils';
import { sortTrackReferences } from './sort-track-bundles';

describe.concurrent('Test sorting track bundles by source and isLocal.', () => {
  test.each([
    {
      unsorted: [
        mockTrackReferenceSubscribed('B', Track.Source.ScreenShare, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: true,
        }),
        mockTrackReferenceSubscribed('C', Track.Source.ScreenShare, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: false,
        }),
        mockTrackReferenceSubscribed('A', Track.Source.Camera, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: true,
        }),
        mockTrackReferenceSubscribed('D', Track.Source.Camera, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: false,
        }),
      ],
      expected: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: true,
        }),
        mockTrackReferenceSubscribed('C', Track.Source.ScreenShare, { mockPublication: true }),
        mockTrackReferenceSubscribed('B', Track.Source.ScreenShare, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: true,
        }),
        mockTrackReferenceSubscribed('D', Track.Source.Camera, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: false,
        }),
      ],
    },
  ])('ScreenShare should come before Camera sources.', ({ unsorted, expected }) => {
    const result = sortTrackReferences(unsorted);
    expect(flatTrackReferenceArray(result)).toStrictEqual(flatTrackReferenceArray(expected));
  });
});
