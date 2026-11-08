import { type Room, type TextStreamInfo } from 'livekit-client';
import { from, scan, Subject, type Observable } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import { ParticipantAgentAttributes } from '../helper';

/**
 * Lifecycle of a text stream:
 * - `pending`: the stream is open and still receiving chunks.
 * - `complete`: the writer closed the stream cleanly, so its text is whole.
 * - `failed`: reading the stream errored (most commonly a `DataStreamError` with
 *   reason `AbnormalEnd` when the sender disconnects mid-stream). The text
 *   accumulated before the failure is kept, but it may be incomplete.
 */
export type TextStreamData = {
  text: string;
  participantInfo: { identity: string }; // Replace with the correct type from livekit-client
  streamInfo: TextStreamInfo;
} & ({ status: 'pending' | 'complete' } | { status: 'failed'; error: Error });

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

          // Locate this reader's entry. Transcription updates for a segment arrive
          // as separate streams sharing the same lk.segment_id, so they merge into
          // a single entry; everything else is keyed by stream id.
          const indexOfStream = () =>
            textStreams.findIndex(
              (stream) =>
                stream.streamInfo.id === reader.info.id ||
                (isTranscription &&
                  stream.streamInfo.attributes?.[segmentAttribute] ===
                    reader.info.attributes?.[segmentAttribute]),
            );

          const emit = () => textStreamsSubject.next([...textStreams]);

          // Subscribe to the stream and update our array as its lifecycle advances.
          // The `error` handler is essential: without it RxJS reports the unhandled
          // observable error by rethrowing it globally from a timer, so a benign
          // mid-stream disconnect surfaces as an uncaught DataStreamError that no
          // application code can catch.
          streamObservable.subscribe({
            next: (accumulatedText) => {
              const index = indexOfStream();
              if (index !== -1) {
                textStreams[index] = {
                  status: 'pending',
                  text: accumulatedText,
                  participantInfo: textStreams[index].participantInfo,
                  // Carry the latest streamInfo forward. Keeping the original would
                  // freeze attributes that change over a segment's lifetime — notably
                  // lk.transcription_final flipping "false" -> "true" on the final
                  // user STT result.
                  streamInfo: reader.info,
                };
              } else {
                // Stream id wasn't found (new stream)
                textStreams.push({
                  status: 'pending',
                  text: accumulatedText,
                  participantInfo,
                  streamInfo: reader.info,
                });
              }
              emit();
            },
            // A clean close from the writer means the stream's text is whole. Nothing
            // was received for a stream that completes with no chunks, so there is no
            // entry to mark and nothing to add.
            complete: () => {
              const index = indexOfStream();
              if (index === -1) return;
              const existing = textStreams[index];
              textStreams[index] = {
                status: 'complete',
                text: existing.text,
                participantInfo: existing.participantInfo,
                streamInfo: reader.info,
              };
              emit();
            },
            // Mark the stream failed, keeping whatever text arrived before the error.
            // A stream that fails before emitting still surfaces as a failed entry so
            // consumers can see it rather than have it silently disappear.
            error: (error: Error) => {
              const index = indexOfStream();
              if (index === -1) {
                textStreams.push({
                  status: 'failed',
                  text: '',
                  participantInfo,
                  streamInfo: reader.info,
                  error,
                });
              } else {
                const existing = textStreams[index];
                textStreams[index] = {
                  status: 'failed',
                  text: existing.text,
                  participantInfo: existing.participantInfo,
                  streamInfo: reader.info,
                  error,
                };
              }
              emit();
            },
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
