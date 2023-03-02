import { Participant, Track } from 'livekit-client';
import { describe, test, expect } from 'vitest';
import { requiredPlaceholders } from './useTracks';

describe('Test requiredPlaceholders functions indicates that placeholders are required.', () => {
  test('Participants without tracks should be included in the map.', () => {
    const sources = [{ source: Track.Source.Camera, withPlaceholder: true }];
    const participants = [new Participant('sid_A', 'identity_A')];
    const results = requiredPlaceholders(sources, participants);
    expect(results.get('identity_A')).toStrictEqual([Track.Source.Camera]);
  });

  test("Multiple participants should be included in the map if they don't have a subscribed tracks.", () => {
    const sources = [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: true },
    ];
    const participants = [
      new Participant('sid_A', 'identity_A'),
      new Participant('sid_B', 'identity_B'),
    ];
    const results = requiredPlaceholders(sources, participants);
    expect(results.get('identity_A')).toStrictEqual([
      Track.Source.Camera,
      Track.Source.ScreenShare,
    ]);
    expect(results.get('identity_B')).toStrictEqual([
      Track.Source.Camera,
      Track.Source.ScreenShare,
    ]);
  });

  test('The map should only include placeholders for if `withPlaceholder: true`', () => {
    const sources = [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ];
    const participants = [
      new Participant('sid_A', 'identity_A'),
      new Participant('sid_B', 'identity_B'),
    ];
    const results = requiredPlaceholders(sources, participants);
    expect(results.get('identity_A')).toStrictEqual([Track.Source.Camera]);
    expect(results.get('identity_B')).toStrictEqual([Track.Source.Camera]);
  });
  test('If no placeholders are wanted the map should be empty', () => {
    const sources = [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ];
    const participants = [
      new Participant('sid_A', 'identity_A'),
      new Participant('sid_B', 'identity_B'),
    ];
    const results = requiredPlaceholders(sources, participants);
    expect(results.size).toBe(0);
    expect(results.has('identity_A')).toBeFalsy();
    expect(results.has('identity_B')).toBeFalsy();
  });
});
