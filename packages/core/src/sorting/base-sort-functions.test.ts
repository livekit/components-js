import { Track } from 'livekit-client';
import { describe, test, expect } from 'vitest';
import {
  flatTrackBundleArray,
  mockTrackBundlePlaceholder,
  mockTrackBundleSubscribed,
} from '../track-bundle/test-utils';
import {
  sortParticipantsByAudioLevel,
  sortParticipantsByIsSpeaking,
  sortParticipantsByJoinedAt,
  sortParticipantsByLastSpokenAT,
  sortTrackBundlesByScreenShare,
  sortTrackBundlesByType,
} from './base-sort-functions';

describe.concurrent('Test sorting participants by isSpeaking:', () => {
  test.each([
    {
      unsorted: [
        { isSpeaking: false, id: 'A' },
        { isSpeaking: false, id: 'B' },
      ],
      expected: [
        { isSpeaking: false, id: 'A' },
        { isSpeaking: false, id: 'B' },
      ],
    },
    {
      unsorted: [
        { isSpeaking: false, id: 'A' },
        { isSpeaking: true, id: 'B' },
        { isSpeaking: true, id: 'C' },
      ],
      expected: [
        { isSpeaking: true, id: 'B' },
        { isSpeaking: true, id: 'C' },
        { isSpeaking: false, id: 'A' },
      ],
    },
  ])('Test that the last speaker is ahead of the previous speaker.', ({ unsorted, expected }) => {
    unsorted.sort(sortParticipantsByIsSpeaking);
    expect(unsorted).toStrictEqual(expected);
  });
});

describe.concurrent('Test sorting participants by lastSpokenAt:', () => {
  test.each([
    {
      unsorted: [
        { lastSpokeAt: undefined, id: 'A' },
        { lastSpokeAt: undefined, id: 'B' },
      ],
      expected: [
        { lastSpokeAt: undefined, id: 'A' },
        { lastSpokeAt: undefined, id: 'B' },
      ],
    },
    {
      unsorted: [
        { lastSpokeAt: new Date(1), id: 'A' },
        { lastSpokeAt: new Date(0), id: 'B' },
      ],
      expected: [
        { lastSpokeAt: new Date(1), id: 'A' },
        { lastSpokeAt: new Date(0), id: 'B' },
      ],
    },
    {
      unsorted: [
        { lastSpokeAt: new Date(1), id: 'A' },
        { lastSpokeAt: new Date(4), id: 'B' },
        { lastSpokeAt: new Date(0), id: 'C' },
      ],
      expected: [
        { lastSpokeAt: new Date(4), id: 'B' },
        { lastSpokeAt: new Date(1), id: 'A' },
        { lastSpokeAt: new Date(0), id: 'C' },
      ],
    },
    {
      unsorted: [
        { lastSpokeAt: new Date(6), id: 'A' },
        { lastSpokeAt: new Date(3), id: 'B' },
        { lastSpokeAt: undefined, id: 'C' },
      ],
      expected: [
        { lastSpokeAt: new Date(6), id: 'A' },
        { lastSpokeAt: new Date(3), id: 'B' },
        { lastSpokeAt: undefined, id: 'C' },
      ],
    },
  ])('Test that the last speaker is ahead of the previous speaker.', ({ unsorted, expected }) => {
    unsorted.sort(sortParticipantsByLastSpokenAT);
    expect(unsorted).toStrictEqual(expected);
  });
});

describe.concurrent('Test sorting participants by audioLevel.', () => {
  test.each([
    {
      unsorted: [{ audioLevel: 0.1 }, { audioLevel: 0 }],
      expected: [{ audioLevel: 0.1 }, { audioLevel: 0 }],
    },
    {
      unsorted: [{ audioLevel: 0.1 }, { audioLevel: 0.5 }],
      expected: [{ audioLevel: 0.5 }, { audioLevel: 0.1 }],
    },
    {
      unsorted: [{ audioLevel: 0 }, { audioLevel: 1 }],
      expected: [{ audioLevel: 1 }, { audioLevel: 0 }],
    },
  ])(
    'Test that the higher audio levels get sorted to the front of the array.',
    ({ unsorted, expected }) => {
      unsorted.sort(sortParticipantsByAudioLevel);
      expect(unsorted).toStrictEqual(expected);
    },
  );

  test.each([
    {
      unsorted: [
        { audioLevel: 0, id: 'A' },
        { audioLevel: 0, id: 'B' },
      ],
      expected: [
        { audioLevel: 0, id: 'A' },
        { audioLevel: 0, id: 'B' },
      ],
    },
    {
      unsorted: [
        { audioLevel: 1, id: 'A' },
        { audioLevel: 1, id: 'B' },
      ],
      expected: [
        { audioLevel: 1, id: 'A' },
        { audioLevel: 1, id: 'B' },
      ],
    },
  ])("Test that equal audio levels don't change the order", ({ unsorted, expected }) => {
    unsorted.sort(sortParticipantsByAudioLevel);
    expect(unsorted).toStrictEqual(expected);
  });
});

describe.concurrent('Test sorting track bundles by type.', () => {
  test.each([
    {
      unsorted: [
        mockTrackBundlePlaceholder('A', Track.Source.Camera),
        mockTrackBundleSubscribed('B', Track.Source.Camera),
      ],
      expected: [
        mockTrackBundleSubscribed('B', Track.Source.Camera),
        mockTrackBundlePlaceholder('A', Track.Source.Camera),
      ],
    },
    {
      unsorted: [
        mockTrackBundlePlaceholder('A', Track.Source.Camera),
        mockTrackBundlePlaceholder('B', Track.Source.Camera),
      ],
      expected: [
        mockTrackBundlePlaceholder('A', Track.Source.Camera),
        mockTrackBundlePlaceholder('B', Track.Source.Camera),
      ],
    },
    {
      unsorted: [
        mockTrackBundleSubscribed('A', Track.Source.Camera),
        mockTrackBundleSubscribed('B', Track.Source.Camera),
      ],
      expected: [
        mockTrackBundleSubscribed('A', Track.Source.Camera),
        mockTrackBundleSubscribed('B', Track.Source.Camera),
      ],
    },
    {
      unsorted: [
        mockTrackBundleSubscribed('A', Track.Source.Camera),
        mockTrackBundleSubscribed('B', Track.Source.ScreenShare),
      ],
      expected: [
        mockTrackBundleSubscribed('A', Track.Source.Camera),
        mockTrackBundleSubscribed('B', Track.Source.ScreenShare),
      ],
    },
  ])('TrackBundle should be for TrackBundlePlaceholders', ({ unsorted, expected }) => {
    unsorted.sort(sortTrackBundlesByType);
    expect(flatTrackBundleArray(unsorted)).toStrictEqual(flatTrackBundleArray(expected));
  });
});

describe.concurrent('Test sorting participants by joinedAt:', () => {
  test.each([
    {
      unsorted: [
        { joinedAt: new Date(0), id: 'A' },
        { joinedAt: new Date(1), id: 'B' },
      ],
      expected: [
        { joinedAt: new Date(0), id: 'A' },
        { joinedAt: new Date(1), id: 'B' },
      ],
    },
    {
      unsorted: [
        { joinedAt: new Date(1), id: 'B' },
        { joinedAt: new Date(0), id: 'A' },
        { joinedAt: new Date(2), id: 'B' },
      ],
      expected: [
        { joinedAt: new Date(0), id: 'A' },
        { joinedAt: new Date(1), id: 'B' },
        { joinedAt: new Date(2), id: 'B' },
      ],
    },
  ])(
    'Test that participants that are longer in the room than others come first.',
    ({ unsorted, expected }) => {
      unsorted.sort(sortParticipantsByJoinedAt);
      expect(unsorted).toStrictEqual(expected);
    },
  );

  test.each([
    {
      unsorted: [
        { joinedAt: new Date(0), id: 'A' },
        { joinedAt: undefined, id: 'B' },
      ],
      expected: [
        { joinedAt: new Date(0), id: 'A' },
        { joinedAt: undefined, id: 'B' },
      ],
    },
    {
      unsorted: [
        { joinedAt: undefined, id: 'A' },
        { joinedAt: undefined, id: 'B' },
      ],
      expected: [
        { joinedAt: undefined, id: 'A' },
        { joinedAt: undefined, id: 'B' },
      ],
    },
  ])(
    'Test edge cases for participants that are longer in the room than others come first.',
    ({ unsorted, expected }) => {
      unsorted.sort(sortParticipantsByJoinedAt);
      expect(unsorted).toStrictEqual(expected);
    },
  );
});

describe.concurrent('Test sorting track bundles by source.', () => {
  test.each([
    {
      unsorted: [
        mockTrackBundleSubscribed('A', Track.Source.Camera, { mockPublication: true }),
        mockTrackBundleSubscribed('B', Track.Source.ScreenShare, { mockPublication: true }),
      ],
      expected: [
        mockTrackBundleSubscribed('B', Track.Source.ScreenShare, { mockPublication: true }),
        mockTrackBundleSubscribed('A', Track.Source.Camera, { mockPublication: true }),
      ],
    },
  ])('ScreenShare should come before Camera sources.', ({ unsorted, expected }) => {
    unsorted.sort(sortTrackBundlesByScreenShare);
    expect(flatTrackBundleArray(unsorted)).toStrictEqual(flatTrackBundleArray(expected));
  });
});
