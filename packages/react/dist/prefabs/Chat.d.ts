import { ChatOptions } from '@livekit/components-core';
import { MessageFormatter } from '../components/ChatEntry';
import * as React from 'react';
/** @public */
export interface ChatProps extends React.HTMLAttributes<HTMLDivElement>, ChatOptions {
    messageFormatter?: MessageFormatter;
}
/**
 * The Chat component provides ready-to-use chat functionality in a LiveKit room.
 * Messages are distributed to all participants in the room in real-time.
 *
 * @remarks
 * - Only users who are in the room at the time of dispatch will receive messages
 * - Message history is not persisted between sessions
 * - Requires `@livekit/components-styles` to be imported for styling
 *
 * @example
 * ```tsx
 * import '@livekit/components-styles';
 *
 * function Room() {
 *   return (
 *     <LiveKitRoom data-lk-theme="default">
 *       <Chat />
 *     </LiveKitRoom>
 *   );
 * }
 * ```
 *
 * For custom styling, refer to: https://docs.livekit.io/reference/components/react/concepts/style-components/
 *
 * @public
 */
export declare function Chat({ messageFormatter, messageDecoder, messageEncoder, channelTopic, ...props }: ChatProps): React.JSX.Element;
//# sourceMappingURL=Chat.d.ts.map