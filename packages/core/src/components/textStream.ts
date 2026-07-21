import { RoomEvent, type Room, type TextStreamInfo } from 'livekit-client';
import { from, scan, Subject, type Observable } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import { ParticipantAgentAttributes } from '../helper';

export interface TextStreamData {
  text: string;
  participantInfo: { identity: string }; // Replace with the correct type from livekit-client
  streamInfo: TextStreamInfo;
  /**
   * Client-side timestamp (ms since epoch) captured the moment this stream was first opened,
   * before any text arrived. Used for chronological ordering: unlike `streamInfo.timestamp`
   * (stamped by the sender's clock) this is sampled from a single local clock, so it stays
   * comparable across streams from different senders, and unlike insertion order it is immune
   * to text that streams in late.
   */
  firstReceivedTime: number;
}

// Singleton getters for lazy initialization
let observableCacheInstance: Map<string, Observable<TextStreamData[]>> | null = null;
let roomInstanceMapInstance: WeakMap<Room, string> | null = null;
let nextRoomId = 0;

// Get or create the observable cache
function getObservableCache(): Map<string, Observable<TextStreamData[]>> {
  if (!observableCacheInstance) {
    observableCacheInstance = new Map<string, Observable<TextStreamData[]>>();
  }
  return observableCacheInstance;
}

// Get or create the room instance map
function getRoomInstanceMap(): WeakMap<Room, string> {
  if (!roomInstanceMapInstance) {
    roomInstanceMapInstance = new WeakMap<Room, string>();
  }
  return roomInstanceMapInstance;
}

// Helper to generate cache key
function getCacheKey(room: Room, topic: string): string {
  const instanceMap = getRoomInstanceMap();

  // Get or create a unique ID for this room instance
  let roomId = instanceMap.get(room);
  if (!roomId) {
    roomId = `room_${nextRoomId++}`;
    instanceMap.set(room, roomId);
  }

  return `${roomId}:${topic}`;
}

export function setupTextStream(room: Room, topic: string): Observable<TextStreamData[]> {
  const cacheKey = getCacheKey(room, topic);
  const observableCache = getObservableCache();

  // Check if we already have an observable for this room and topic
  const existingObservable = observableCache.get(cacheKey);
  if (existingObservable) {
    return existingObservable;
  }

  const textStreamsSubject = new Subject<TextStreamData[]>();
  let textStreams: TextStreamData[] = [];
  // The first time we become aware of a stream (its header arrives), keyed by the same
  // identity used for de-duplication below — the transcription segment id when present,
  // otherwise the stream id. Captured once and never overwritten, so create/update streams
  // for the same segment share the earliest time.
  let firstReceivedTimes = new Map<string, number>();

  const segmentAttribute = ParticipantAgentAttributes.TranscriptionSegmentId;

  // Emit a snapshot ordered chronologically by when each stream was first opened rather than
  // by the order in which the first chunk happened to arrive. Streams whose text is delayed
  // would otherwise sort after streams that streamed immediately, producing out-of-order
  // transcriptions (e.g. an agent reply appearing before the user utterance it answered).
  // Array#sort is stable, so streams sharing a timestamp keep their insertion order.
  const emit = () => {
    textStreamsSubject.next(
      textStreams.slice().sort((a, b) => a.firstReceivedTime - b.firstReceivedTime),
    );
  };

  // Create shared observable and store in cache
  const sharedObservable = textStreamsSubject.pipe(
    tap({
      subscribe: () => {
        room.registerTextStreamHandler(topic, async (reader, participantInfo) => {
          // Create an observable from the reader
          const streamObservable = from(reader).pipe(
            scan((acc: string, chunk: string) => {
              return acc + chunk;
            }, ''),
          );

          const isTranscription = !!reader.info.attributes?.[segmentAttribute];

          // Capture when this stream was first opened — now, before any text has streamed in —
          // so ordering is unaffected by how quickly each stream's text arrives.
          const streamKey =
            (isTranscription ? reader.info.attributes?.[segmentAttribute] : undefined) ??
            reader.info.id;
          if (!firstReceivedTimes.has(streamKey)) {
            firstReceivedTimes.set(streamKey, Date.now());
          }
          const firstReceivedTime = firstReceivedTimes.get(streamKey)!;

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
              emit();
            } else {
              // Handle case where stream ID wasn't found (new stream)
              textStreams.push({
                text: accumulatedText,
                participantInfo,
                streamInfo: reader.info,
                firstReceivedTime,
              });

              // Emit the updated array with the new stream
              emit();
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

  observableCache.set(cacheKey, sharedObservable);

  // Add cleanup when room is disconnected
  room.on(RoomEvent.Disconnected, () => {
    getObservableCache().delete(cacheKey);
    textStreams = [];
    firstReceivedTimes = new Map();
    textStreamsSubject.next([]);
  });

  return sharedObservable;
}
