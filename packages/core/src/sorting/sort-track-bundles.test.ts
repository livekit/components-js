import { Track } from 'livekit-client';
import { describe, test, expect } from 'vitest';
import { flatTrackBundleArray, mockTrackBundleSubscribed } from '../track-bundle/test-utils';
import { sortTrackBundles } from './sort-track-bundles';

describe.concurrent('Test sorting track bundles by source and isLocal.', () => {
  test.each([
    {
      unsorted: [
        mockTrackBundleSubscribed('B', Track.Source.ScreenShare, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: true,
        }),
        mockTrackBundleSubscribed('C', Track.Source.ScreenShare, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: false,
        }),
        mockTrackBundleSubscribed('A', Track.Source.Camera, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: true,
        }),
        mockTrackBundleSubscribed('D', Track.Source.Camera, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: false,
        }),
      ],
      expected: [
        mockTrackBundleSubscribed('A', Track.Source.Camera, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: true,
        }),
        mockTrackBundleSubscribed('C', Track.Source.ScreenShare, { mockPublication: true }),
        mockTrackBundleSubscribed('B', Track.Source.ScreenShare, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: true,
        }),
        mockTrackBundleSubscribed('D', Track.Source.Camera, {
          mockPublication: true,
          mockParticipant: true,
          mockIsLocal: false,
        }),
      ],
    },
  ])('ScreenShare should come before Camera sources.', ({ unsorted, expected }) => {
    const result = sortTrackBundles(unsorted);
    expect(flatTrackBundleArray(result)).toStrictEqual(flatTrackBundleArray(expected));
  });
});
