import * as React from 'react';
import { ConnectionState } from 'livekit-client';
import { setupTextStream, TextStreamData } from '@livekit/components-core';
import { useRoomContext } from '../context';
import { useConnectionState } from './useConnectionStatus';
import { useObservableState } from './internal';

export function useTextStream(topic: string) {
  const room = useRoomContext();

  const connectionState = useConnectionState(room);
  const isDisconnected = React.useMemo(
    () => connectionState === ConnectionState.Disconnected,
    [connectionState],
  );

  const textStreamObservable = React.useMemo(() => {
    return setupTextStream(room, topic);
  }, [room, topic, isDisconnected]);

  const textStreams = useObservableState<TextStreamData[]>(textStreamObservable, []);

  return { textStreams };
}
