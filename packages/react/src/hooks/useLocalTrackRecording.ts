import * as React from 'react';
import type { LocalTrack, LocalAudioTrack } from 'livekit-client';
import { isLocalTrack, LocalTrackRecorder } from 'livekit-client';
import type { TrackReference } from '@livekit/components-core';
import { isLocal, isTrackReference, log } from '@livekit/components-core';

export function useLocalTrackRecorder({
  track,
  onChunk,
  onError,
}: {
  track: TrackReference | LocalAudioTrack;
  onChunk: (chunk: Uint8Array) => void;
  onError?: (error: Error) => void;
}) {
  if (isTrackReference(track) && !isLocal(track.participant)) {
    throw TypeError('This hook only supports local audio tracks');
  }

  let _track: LocalTrack | undefined;
  if (isTrackReference(track) && isLocalTrack(track.publication.track)) {
    _track = track.publication.track;
  } else if (!isTrackReference(track) && isLocalTrack(track)) {
    _track = track;
  }
  const recorder = React.useMemo(
    () => (_track ? new LocalTrackRecorder(_track) : undefined),
    [_track],
  );

  const startRecording = React.useCallback(async () => {
    if (!recorder) {
      log.error('No track to record');
      return;
    }

    if (recorder.state === 'recording') {
      log.warn('Recording already started');
      return;
    }

    const stream = await recorder.start();
    try {
      for await (const chunk of stream) {
        onChunk(chunk);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [recorder, onChunk, onError]);

  const stopRecording = React.useCallback(async () => {
    if (!recorder) {
      log.warn('No active recording');
      return;
    }
    recorder?.stop();
  }, [recorder]);

  return { stop: stopRecording, start: startRecording };
}
