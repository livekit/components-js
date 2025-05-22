import { RoomEvent, type Room } from 'livekit-client';
import type { TextStreamInfo } from 'livekit-client/dist/src/room/types';
import { from, scan, Subject, type Observable } from 'rxjs';
import { share } from 'rxjs/operators';

export interface TextStreamData {
  text: string;
  participantInfo: { identity: string }; // Replace with the correct type from livekit-client
  streamInfo: TextStreamInfo;
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
  const textStreams: TextStreamData[] = [];

  const segmentAttribute = 'lk.segment_id';

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

  // Create shared observable and store in cache
  const sharedObservable = textStreamsSubject.asObservable().pipe(share());
  observableCache.set(cacheKey, sharedObservable);

  // Add cleanup when room is disconnected
  room.once(RoomEvent.Disconnected, () => {
    room.unregisterTextStreamHandler(topic);
    textStreamsSubject.complete();
    getObservableCache().delete(cacheKey);
  });

  return sharedObservable;
}
