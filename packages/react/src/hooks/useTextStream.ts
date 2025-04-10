import * as React from 'react';
import { ConnectionState } from 'livekit-client';
import { setupTextStream, type TextStreamData } from '@livekit/components-core';
import { useRoomContext } from '../context';
import { useConnectionState } from './useConnectionStatus';
import { useObservableState } from './internal';

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
export function useTextStream(topic: string) {
  const room = useRoomContext();

  const connectionState = useConnectionState(room);
  const isDisconnected = connectionState === ConnectionState.Disconnected;

  const textStreamData = React.useMemo(() => setupTextStream(room, topic), [room, topic]);
  const textStreamObservable = isDisconnected ? undefined : textStreamData;

  const textStreams = useObservableState<TextStreamData[]>(textStreamObservable, []);

  return { textStreams };
}
