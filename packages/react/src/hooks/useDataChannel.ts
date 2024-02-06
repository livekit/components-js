import type { ReceivedDataMessage } from '@livekit/components-core';
import { setupDataMessageHandler } from '@livekit/components-core';
import * as React from 'react';
import type { DataPublishOptions } from 'livekit-client';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';

type UseDataChannelReturnType<T extends string | undefined = undefined> = {
  isSending: boolean;
  send: (payload: Uint8Array, options: DataPublishOptions) => void;
  message: ReceivedDataMessage<T> | undefined;
};

/**
 * The `useDataChannel` hook returns the ability to send and receive messages.
 * By optionally passing a `topic`, you can narrow down which messages are returned in the messages array.
 * @remarks
 * There is only one data channel. Passing a `topic` does not open a new data channel.
 * It is only used to filter out messages with no or a different `topic`.
 *
 * @example
 * ```tsx
 * // Send messages to all participants via the 'chat' topic.
 * const { message, send } = useDataChannel('chat');
 * ```
 * @public
 */
export function useDataChannel<T extends string>(
  topic: T,
  onMessage?: (msg: ReceivedDataMessage<T>) => void,
): UseDataChannelReturnType<T>;
/**
 * The `useDataChannel` hook returns the ability to send and receive messages.
 * @remarks
 * There is only one data channel. Passing a `topic` does not open a new data channel.
 * It is only used to filter out messages with no or a different `topic`.
 *
 * @example
 * ```tsx
 * // Send messages to all participants
 * const { message, send } = useDataChannel(callback);
 * ```
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
