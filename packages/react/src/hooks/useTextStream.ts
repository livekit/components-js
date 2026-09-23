import * as React from 'react';
import { ConnectionState, Room } from 'livekit-client';
import { setupTextStream, type TextStreamData } from '@livekit/components-core';
import { useEnsureRoom } from '../context';
import { useConnectionState } from './useConnectionStatus';
import { useObservableState } from './internal';

/** @beta */
export type UseTextStreamOptions = {
  room?: Room;
  /** When false, the hook subscribes to nothing and returns an empty result. Defaults to true. */
  enabled?: boolean;
};

/**
 * @beta
 * @param topic - the topic to listen to
 * @returns an array of TextStreamData that holds the text, participantInfo, and streamInfo
 * @example
 * ```tsx
 * const { textStreams } = useTextStream('my-topic');
 * return <div>{textStreams.map((textStream) => textStream.text)}</div>;
 * ```
 */
export function useTextStream(topic: string, options?: UseTextStreamOptions) {
  const enabled = options?.enabled ?? true;
  const room = useEnsureRoom(options?.room);

  const connectionState = useConnectionState(room);
  const isDisconnected = connectionState === ConnectionState.Disconnected;

  const textStreamData = React.useMemo(
    () => (enabled ? setupTextStream(room, topic) : undefined),
    [room, topic, enabled],
  );
  const textStreamObservable = !enabled || isDisconnected ? undefined : textStreamData;

  const textStreams = useObservableState<TextStreamData[]>(textStreamObservable, []);

  return { textStreams };
}
