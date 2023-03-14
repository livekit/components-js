import { setupDataMessageHandler } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from '../helper';

export function useDataChannel(topic?: string) {
  const room = useRoomContext();
  const { send, messageObservable, isSendingObservable } = React.useMemo(
    () => setupDataMessageHandler(room, topic),
    [room, topic],
  );

  const message = useObservableState(messageObservable, undefined);
  const isSending = useObservableState(isSendingObservable, false);

  return {
    message,
    send,
    isSending,
  };
}
