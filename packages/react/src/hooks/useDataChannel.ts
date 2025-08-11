import type { ReceivedDataMessage } from '@livekit/components-core';
import { setupDataMessageHandler } from '@livekit/components-core';
import * as React from 'react';
import type { DataPublishOptions } from 'livekit-client';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';

type UseDataChannelReturnType<T extends string | undefined = undefined> = {
  isSending: boolean;
  send: (payload: Uint8Array, options: DataPublishOptions) => Promise<void>;
  message: ReceivedDataMessage<T> | undefined;
};

/**
 * The `useDataChannel` hook returns the ability to send and receive messages.
 * Pass an optional `topic` to narrow down which messages are returned in the messages array.
 *
 * @remarks
 * There is only one data channel. Passing a `topic` does not open a new data channel.
 * It is only used to filter out messages with no or a different `topic`.
 *
 * @example
 * ```tsx
 * // Send messages to all participants via the 'chat' topic.
 * const { message: latestMessage, send } = useDataChannel('chat', (msg) => console.log("message received", msg));
 * ```
 *
 * @example
 * ```tsx
 * // Receive all messages (no topic filtering)
 * const { message: latestMessage, send } = useDataChannel((msg) => console.log("message received", msg));
 * ```
 *
 * @public
 */
export function useDataChannel<T extends string>(
  topic: T,
  onMessage?: (msg: ReceivedDataMessage<T>) => void,
): UseDataChannelReturnType<T>;

/**
 * Overload for `useDataChannel` without a topic. See {@link (useDataChannel:1)} for information and usage examples.
 *
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
