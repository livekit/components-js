import { describe, test, expect } from 'vitest';
import {
  sortParticipantsByAudioLevel,
  sortParticipantsByIsSpeaking,
  sortParticipantsByLastSpokenAT,
} from './base-sort-functions';

describe.concurrent('Test sorting participants by audioLevel.', () => {
  test.each([
    { a: { audioLevel: 1 }, b: { audioLevel: 0 }, expected: 'a_before_b' },
    { a: { audioLevel: 0.1 }, b: { audioLevel: 0 }, expected: 'a_before_b' },
    { a: { audioLevel: 0.99 }, b: { audioLevel: 0.98 }, expected: 'a_before_b' },
    { a: { audioLevel: 0 }, b: { audioLevel: 1 }, expected: 'b_before_a' },
    { a: { audioLevel: 0.5 }, b: { audioLevel: 0.9 }, expected: 'b_before_a' },
    { a: { audioLevel: 1 }, b: { audioLevel: 1 }, expected: 'a_equal_b' },
    { a: { audioLevel: 0 }, b: { audioLevel: 0 }, expected: 'a_equal_b' },
    { a: { audioLevel: 0.5 }, b: { audioLevel: 0.5 }, expected: 'a_equal_b' },
  ])(
    'a(audioLevel: $a.audioLevel) | b(audioLevel: $b.audioLevel) expected order -> $expected',
    ({ a, b, expected }) => {
      const sortResult = sortParticipantsByAudioLevel(a, b);
      switch (expected) {
        case 'a_before_b':
          expect(sortResult).toBeGreaterThan(0);
          break;
        case 'b_before_a':
          expect(sortResult).toBeLessThan(0);
          break;
        case 'a_equal_b':
          expect(sortResult).toBe(0);
          break;
      }
    },
  );
});

describe.concurrent('Test sorting participants by isSpeaking:', () => {
  test.each([
    { a: { isSpeaking: false }, b: { isSpeaking: false }, expected: 'a_equal_b' },
    { a: { isSpeaking: true }, b: { isSpeaking: true }, expected: 'a_equal_b' },
    { a: { isSpeaking: true }, b: { isSpeaking: false }, expected: 'a_before_b' },
    { a: { isSpeaking: false }, b: { isSpeaking: true }, expected: 'b_before_a' },
  ])(
    'a(isSpeaking: $a.isSpeaking) | b(isSpeaking: $b.isSpeaking) expected order -> $expected',
    ({ a, b, expected }) => {
      const sortResult = sortParticipantsByIsSpeaking(a, b);
      switch (expected) {
        case 'a_before_b':
          expect(sortResult).toBeGreaterThan(0);
          break;
        case 'b_before_a':
          expect(sortResult).toBeLessThan(0);
          break;
        case 'a_equal_b':
          expect(sortResult).toBe(0);
          break;
      }
    },
  );
});

describe.concurrent('Test sorting participants by lastSpokenAt:', () => {
  test.each([
    { a: { lastSpokeAt: undefined }, b: { lastSpokeAt: undefined }, expected: 'a_equal_b' },
    { a: { lastSpokeAt: undefined }, b: { lastSpokeAt: new Date(1) }, expected: 'b_equal_a' },
    { a: { lastSpokeAt: new Date(1) }, b: { lastSpokeAt: undefined }, expected: 'a_before_b' },
    { a: { lastSpokeAt: new Date(1) }, b: { lastSpokeAt: new Date(1) }, expected: 'a_equal_b' },
    { a: { lastSpokeAt: new Date(0) }, b: { lastSpokeAt: new Date(0) }, expected: 'a_equal_b' },
    { a: { lastSpokeAt: new Date(1) }, b: { lastSpokeAt: new Date(0) }, expected: 'a_before_b' },
    { a: { lastSpokeAt: new Date(1) }, b: { lastSpokeAt: new Date(2) }, expected: 'b_before_a' },
  ])(
    'a(lastSpokeAt: $a.lastSpokeAt) | b(lastSpokeAt: $b.lastSpokeAt) expected order -> $expected',
    ({ a, b, expected }) => {
      const sortResult = sortParticipantsByLastSpokenAT(a, b);
      switch (expected) {
        case 'a_before_b':
          expect(sortResult).toBeGreaterThan(0);
          break;
        case 'b_before_a':
          expect(sortResult).toBeLessThan(0);
          break;
        case 'a_equal_b':
          expect(sortResult).toBe(0);
          break;
      }
    },
  );
});
