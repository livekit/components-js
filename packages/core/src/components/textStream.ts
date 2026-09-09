import { type Room, type TextStreamInfo } from 'livekit-client';
import { from, scan, Subject, type Observable } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import { ParticipantAgentAttributes } from '../helper';

export interface TextStreamData {
  text: string;
  participantInfo: { identity: string }; // Replace with the correct type from livekit-client
  streamInfo: TextStreamInfo;
}

// One observable per room and topic. The outer map is weak so a room that is no
// longer referenced takes its observables with it, while a reused room keeps
// them across connect/disconnect cycles.
const observableCache = new WeakMap<Room, Map<string, Observable<TextStreamData[]>>>();

function getTopicCache(room: Room): Map<string, Observable<TextStreamData[]>> {
  let topicCache = observableCache.get(room);
  if (!topicCache) {
    topicCache = new Map<string, Observable<TextStreamData[]>>();
    observableCache.set(room, topicCache);
  }
  return topicCache;
}

export function setupTextStream(room: Room, topic: string): Observable<TextStreamData[]> {
  const topicCache = getTopicCache(room);

  // Check if we already have an observable for this room and topic
  const existingObservable = topicCache.get(topic);
  if (existingObservable) {
    return existingObservable;
  }

  const textStreamsSubject = new Subject<TextStreamData[]>();
  let textStreams: TextStreamData[] = [];

  const segmentAttribute = ParticipantAgentAttributes.TranscriptionSegmentId;

  // Create shared observable and store in cache
  const sharedObservable = textStreamsSubject.pipe(
    tap({
      subscribe: () => {
        // `share()` resets on refcount zero, so this runs once per subscription
        // window: on the first subscriber, and again after every reconnect on a
        // reused room. Each window starts from an empty buffer.
        textStreams = [];
        room.registerTextStreamHandler(topic, async (reader, participantInfo) => {
          // Create an observable from the reader
          const streamObservable = from(reader).pipe(
            scan((acc: string, chunk: string) => {
              return acc + chunk;
            }, ''),
          );

          const isTranscription = !!reader.info.attributes?.[segmentAttribute];

          // Subscribe to the stream and update our array when new chunks arrive
          streamObservable.subscribe((accumulatedText) => {
            // Find and update the stream in our array
            const index = textStreams.findIndex(
              (stream) =>
                stream.streamInfo.id === reader.info.id ||
                (isTranscription &&
                  stream.streamInfo.attributes?.[segmentAttribute] ===
                    reader.info.attributes?.[segmentAttribute]),
            );
            if (index !== -1) {
              textStreams[index] = {
                ...textStreams[index],
                text: accumulatedText,
                // Carry the latest streamInfo forward. Transcription updates for a
                // segment arrive as separate streams sharing the same lk.segment_id;
                // keeping the original streamInfo would freeze attributes that change
                // over the segment's lifetime — notably lk.transcription_final flipping
                // "false" -> "true" on the final user STT result.
                streamInfo: reader.info,
              };

              // Emit the updated array
              textStreamsSubject.next([...textStreams]);
            } else {
              // Handle case where stream ID wasn't found (new stream)
              textStreams.push({
                text: accumulatedText,
                participantInfo,
                streamInfo: reader.info,
              });

              // Emit the updated array with the new stream
              textStreamsSubject.next([...textStreams]);
            }
          });
        });
      },
      finalize: () => {
        room.unregisterTextStreamHandler(topic);
      },
    }),
    share(),
  );

  topicCache.set(topic, sharedObservable);

  return sharedObservable;
}
