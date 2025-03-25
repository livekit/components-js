import { recordingStatusObservable } from '@livekit/components-core';
import * as React from 'react';
import { useEnsureRoom } from '../context';
import { useObservableState } from './internal';
import { useConnectionState } from './useConnectionStatus';
import type { Room } from 'livekit-client';

/**
 * The `useIsRecording` hook returns a `boolean` that indicates if the room is currently being recorded.
 * @example
 * ```tsx
 * const isRecording = useIsRecording();
 * ```
 * @public
 */
export function useIsRecording(room?: Room) {
  const r = useEnsureRoom(room);
  const connectionState = useConnectionState(r);
  const observable = React.useMemo(() => recordingStatusObservable(r), [r, connectionState]);
  const isRecording = useObservableState(observable, r.isRecording);

  return isRecording;
}
