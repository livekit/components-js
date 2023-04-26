import type { ReceivedDataMessage } from '@livekit/components-core';
import { setupDataMessageHandler } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';

/** @public */
export function useDataChannel<T extends string>(
  topic?: T,
  onMessage?: (msg: ReceivedDataMessage<T>) => void,
) {
  const room = useRoomContext();
  const { send, messageObservable, isSendingObservable } = React.useMemo(
    () => setupDataMessageHandler(room, topic, onMessage),
    [room, topic, onMessage],
  );

  const message = useObservableState(messageObservable, undefined);
  const isSending = useObservableState(isSendingObservable, false);

  return {
    message,
    send,
    isSending,
  };
}
