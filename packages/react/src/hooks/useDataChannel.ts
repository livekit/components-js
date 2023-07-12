import type { DataSendOptions, ReceivedDataMessage } from '@livekit/components-core';
import { setupDataMessageHandler } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';

type UseDataChannelReturnType<T extends string | undefined = undefined> = {
  isSending: boolean;
  send: (payload: Uint8Array, options: DataSendOptions) => void;
  message: ReceivedDataMessage<T> | undefined;
};

/**
 * @public
 */
export function useDataChannel<T extends string>(
  topic: T,
  onMessage?: (msg: ReceivedDataMessage<T>) => void,
): UseDataChannelReturnType<T>;
/**
 * @public
 */
export function useDataChannel(
  onMessage?: (msg: ReceivedDataMessage) => void,
): UseDataChannelReturnType;
/**
 * @internal
 */
export function useDataChannel<T extends string>(
  topicOrCallback?: T | ((msg: ReceivedDataMessage) => void),
  callback?: (msg: ReceivedDataMessage<T>) => void,
) {
  const onMessage = typeof topicOrCallback === 'function' ? topicOrCallback : callback;

  const topic = typeof topicOrCallback === 'string' ? topicOrCallback : undefined;
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
