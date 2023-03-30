import { Track } from 'livekit-client';
import { describe, test, expect } from 'vitest';
import {
  flatTrackReferenceArray,
  mockTrackReferencePlaceholder,
  mockTrackReferenceSubscribed,
} from '../track-reference/test-utils';
import {
  sortParticipantsByAudioLevel,
  sortParticipantsByIsSpeaking,
  sortParticipantsByJoinedAt,
  sortParticipantsByLastSpokenAT,
  sortTrackReferencesByScreenShare,
  sortTrackReferencesByType,
  sortTrackRefsByIsCameraEnabled,
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
        mockTrackReferencePlaceholder('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
      expected: [
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferencePlaceholder('A', Track.Source.Camera),
      ],
    },
    {
      unsorted: [
        mockTrackReferencePlaceholder('A', Track.Source.Camera),
        mockTrackReferencePlaceholder('B', Track.Source.Camera),
      ],
      expected: [
        mockTrackReferencePlaceholder('A', Track.Source.Camera),
        mockTrackReferencePlaceholder('B', Track.Source.Camera),
      ],
    },
    {
      unsorted: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
      expected: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
    },
    {
      unsorted: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.ScreenShare),
      ],
      expected: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.ScreenShare),
      ],
    },
  ])('TrackReference should be for TrackReferencePlaceholders', ({ unsorted, expected }) => {
    unsorted.sort(sortTrackReferencesByType);
    expect(flatTrackReferenceArray(unsorted)).toStrictEqual(flatTrackReferenceArray(expected));
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
        mockTrackReferenceSubscribed('A', Track.Source.Camera, { mockPublication: true }),
        mockTrackReferenceSubscribed('B', Track.Source.ScreenShare, { mockPublication: true }),
      ],
      expected: [
        mockTrackReferenceSubscribed('B', Track.Source.ScreenShare, { mockPublication: true }),
        mockTrackReferenceSubscribed('A', Track.Source.Camera, { mockPublication: true }),
      ],
    },
  ])('ScreenShare should come before Camera sources.', ({ unsorted, expected }) => {
    unsorted.sort(sortTrackReferencesByScreenShare);
    expect(flatTrackReferenceArray(unsorted)).toStrictEqual(flatTrackReferenceArray(expected));
  });
});

describe.concurrent('Test sorting track bundles by isCameraEnabled.', () => {
  test.each([
    {
      unsorted: [
        { participant: { isCameraEnabled: true }, testId: 'A' },
        { participant: { isCameraEnabled: false }, testId: 'B' },
      ],
      expected: [
        { participant: { isCameraEnabled: true }, testId: 'A' },
        { participant: { isCameraEnabled: false }, testId: 'B' },
      ],
    },
    {
      unsorted: [
        { participant: { isCameraEnabled: false }, testId: 'A' },
        { participant: { isCameraEnabled: true }, testId: 'B' },
      ],
      expected: [
        { participant: { isCameraEnabled: true }, testId: 'B' },
        { participant: { isCameraEnabled: false }, testId: 'A' },
      ],
    },
    {
      unsorted: [
        { participant: { isCameraEnabled: true }, testId: 'A' },
        { participant: { isCameraEnabled: true }, testId: 'B' },
      ],
      expected: [
        { participant: { isCameraEnabled: true }, testId: 'A' },
        { participant: { isCameraEnabled: true }, testId: 'B' },
      ],
    },
  ])(
    'Track bundles with camera on should come before once with camera off.',
    ({ unsorted, expected }) => {
      unsorted.sort(sortTrackRefsByIsCameraEnabled);
      expect(unsorted).toStrictEqual(expected);
    },
  );
});
