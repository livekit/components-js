// import { describe, test, expect } from 'vitest';
// import {
//   addMediaTimestampToTranscription,
//   dedupeSegments,
//   didActiveSegmentsChange,
//   getActiveTranscriptionSegments,
// } from './transcriptions';
// import type { TranscriptionSegment } from 'livekit-client';

// describe('transcription helpers', () => {
//   const testStartTime = Date.now();
//   const prevSegments: Array<TranscriptionSegment> = [
//     {
//       id: '1',
//       text: 'previous',
//       startTime: testStartTime - 1,
//       endTime: testStartTime,
//       language: 'en-US',
//       final: true,
//     },
//     {
//       id: '2',
//       text: 'previous',
//       startTime: testStartTime,
//       endTime: testStartTime + 1,
//       language: 'en-US',
//       final: true,
//     },
//     {
//       id: '3',
//       text: 'previous',
//       startTime: testStartTime + 1,
//       endTime: testStartTime + 3,
//       language: 'en-US',
//       final: true,
//     },
//     {
//       id: '4',
//       text: 'previous',
//       startTime: testStartTime + 2,
//       endTime: testStartTime + 4,
//       language: 'en-US',
//       final: true,
//     },
//   ];
//   const newSegments: Array<TranscriptionSegment> = [
//     {
//       id: '2',
//       text: 'previous',
//       startTime: Date.now(),
//       endTime: Date.now(),
//       language: 'en-US',
//       final: true,
//     },

//     {
//       id: '4',
//       text: 'previous',
//       startTime: Date.now(),
//       endTime: Date.now(),
//       language: 'en-US',
//       final: true,
//     },
//     {
//       id: '5',
//       text: 'new',
//       startTime: Date.now(),
//       endTime: Date.now(),
//       language: 'en-US',
//       final: true,
//     },
//   ];
//   test('dedupeSegments', () => {
//     const res = dedupeSegments(prevSegments, newSegments, 10);
//     expect(res.length).toBe(5);
//     expect(res.at(-1)?.id).toBe('5');
//   });
//   test('didActiveSegmentsChange', () => {
//     expect(didActiveSegmentsChange(prevSegments, newSegments)).toBe(true);
//     expect(didActiveSegmentsChange(newSegments, newSegments)).toBe(false);
//     expect(didActiveSegmentsChange(prevSegments, prevSegments)).toBe(false);
//   });
//   test('getActiveTranscriptionSegments', () => {
//     const res1 = getActiveTranscriptionSegments(
//       prevSegments.map((s) => addMediaTimestampToTranscription(s, testStartTime - 5)),
//       testStartTime,
//     );
//     expect(res1.length).toBe(2);
//     expect(res1.at(0)?.id).toBe('1');
//     expect(res1.at(1)?.id).toBe('2');

//     const res2 = getActiveTranscriptionSegments(
//       prevSegments.map((s) => addMediaTimestampToTranscription(s, testStartTime - 5)),
//       testStartTime + 3.5,
//     );
//     expect(res2.length).toBe(1);
//     expect(res2.at(0)?.id).toBe('4');
//   });

//   test('getActiveTranscriptionSegments with maxAge', () => {
//     const res1 = getActiveTranscriptionSegments(
//       prevSegments.map((s) => addMediaTimestampToTranscription(s, testStartTime - 5)),
//       testStartTime,
//       5,
//     );
//     expect(res1.length).toBe(2);
//     expect(res1.at(0)?.id).toBe('1');
//     expect(res1.at(1)?.id).toBe('2');

//     const res2 = getActiveTranscriptionSegments(
//       prevSegments.map((s) => addMediaTimestampToTranscription(s, testStartTime - 5)),
//       testStartTime + 3.5,
//       5,
//     );
//     expect(res2.length).toBe(4);
//   });
// });
