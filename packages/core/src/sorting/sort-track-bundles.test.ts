// import { describe, test, expect } from 'vitest';
// import {} from './sort-track-participant-pairs';

// describe.concurrent('Test subparts of track participant pair sort.', () => {
//   test('Basic tests for sortTrackParticipantPairs fn.', () => {
//     const pair_1 = {
//       track: new FakeMediaStreamTrack({ kind: 'video' }) as unknown as TrackPublication,
//       participant: new Participant('sid_1', 'identity_1'),
//     };
//     const pair_2 = {
//       track: new FakeMediaStreamTrack({ kind: 'audio' }) as unknown as TrackPublication,
//       participant: new Participant('sid_2', 'identity_2'),
//     };
//     const pairs = [pair_2, pair_1];
//     const sorted = sortTrackParticipantPairs(pairs);
//     expect(sorted.length).toBe(2);
//     expect(sorted[0].participant.identity).toBe('identity_1');
//   });
// });
