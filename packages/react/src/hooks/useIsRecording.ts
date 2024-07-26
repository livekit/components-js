import { recordingStatusObservable } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';
import { useConnectionState } from './useConnectionStatus';

/**
 * The `useIsRecording` hook returns a `boolean` that indicates if the room is currently being recorded.
 * @example
 * ```tsx
 * const isRecording = useIsRecording();
 * ```
 * @public
 */
export function useIsRecording() {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const observable = React.useMemo(() => recordingStatusObservable(room), [room, connectionState]);
  const isRecording = useObservableState(observable, room.isRecording);

  return isRecording;
}
