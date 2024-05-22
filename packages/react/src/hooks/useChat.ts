import * as React from 'react';
import type { ChatOptions, ReceivedChatMessage } from '@livekit/components-core';
import { setupChat } from '@livekit/components-core';
import { ConnectionState } from 'livekit-client';
import { useRoomContext } from '../context';
import { useObservableState } from './internal/useObservableState';
import { useConnectionState } from './useConnectionStatus';

/**
 * The `useChat` hook provides chat functionality for a LiveKit room.
 * It returns a simple `send` function to send chat messages and an array of `chatMessages` to hold received messages.
 * It also returns a `update` function that allows you to implement message-edit functionality.
 * @remarks
 * It is possible to pass configurations for custom message encoding and decoding and non-default topics on which to send the messages.
 * @public
 */
export function useChat(options?: ChatOptions) {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const isDisconnected = React.useMemo(
    () => connectionState === ConnectionState.Disconnected,
    [connectionState],
  ); // used to reset the messages on room disconnect
  const setup = React.useMemo<ReturnType<typeof setupChat>>(
    () => setupChat(room, options),
    [room, options, isDisconnected],
  );
  const isSending = useObservableState(setup.isSendingObservable, false);
  const chatMessages = useObservableState<ReceivedChatMessage[]>(setup.messageObservable, []);

  return { send: setup.send, update: setup.update, chatMessages, isSending };
}
