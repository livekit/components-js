import { ChatOptions, ReceivedChatMessage } from '@livekit/components-core';
import { Room } from 'livekit-client';
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
export declare function useChat(options?: ChatOptions & {
    room?: Room;
}): {
    send: (message: string, options?: import('livekit-client').SendTextOptions) => Promise<ReceivedChatMessage>;
    chatMessages: ReceivedChatMessage[];
    isSending: boolean;
};
//# sourceMappingURL=useChat.d.ts.map