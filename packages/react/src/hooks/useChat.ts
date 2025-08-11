import * as React from 'react';
import type { ChatOptions, ReceivedChatMessage } from '@livekit/components-core';
import { setupChat } from '@livekit/components-core';
import { ConnectionState } from 'livekit-client';
import { useRoomContext } from '../context';
import { useObservableState } from './internal/useObservableState';
import { useConnectionState } from './useConnectionStatus';

/**
 * The `useChat` hook provides chat functionality for a LiveKit room.
 *
 * @remarks
 * Message history is not persisted and will be lost if the component is refreshed.
 * You may want to persist message history in the browser, a cache or a database.
 *
 * @returns An object containing:
 * - `chatMessages` - Array of received chat messages
 * - `send` - Function to send a new message
 * - `isSending` - Boolean indicating if a message is currently being sent
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { chatMessages, send, isSending } = useChat();
 *
 *   return (
 *     <div>
 *       {chatMessages.map((msg) => (
 *         <div key={msg.timestamp}>
 *           {msg.from?.identity}: {msg.message}
 *         </div>
 *       ))}
 *       <button disabled={isSending} onClick={() => send("Hello!")}>
 *         Send Message
 *       </button>
 *     </div>
 *   );
 * }
 * ```
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

  return { send: setup.send, chatMessages, isSending };
}
