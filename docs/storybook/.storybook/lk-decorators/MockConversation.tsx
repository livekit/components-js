import * as React from 'react';
import { Decorator } from '@storybook/react-vite';
import { useSessionContext } from '@livekit/components-react';
import { DataPacket_Kind, Participant, type RemoteParticipant, RoomEvent } from 'livekit-client';

/**
 * Mirrors `LegacyDataTopic.CHAT` from `@livekit/components-core` (not re-exported from
 * `@livekit/components-react`, so it's inlined here rather than adding a new dependency).
 */
const LEGACY_CHAT_TOPIC = 'lk-chat-topic';

const MOCK_AGENT_PARTICIPANT = new Participant('mock-agent-sid', 'agent', 'Agent');

export type MockConversationMessage = {
  id: string;
  from: 'user' | 'agent';
  message: string;
};

/**
 * Populates the current session's transcript with a scripted conversation, without a real
 * connection or backend agent. Works by emitting fake `RoomEvent.DataReceived` events on the
 * legacy chat topic -- the same public SDK event the chat pipeline listens on -- so any
 * component reading messages via `useSessionMessages()` renders them as if they were received
 * for real.
 *
 * Must be nested inside a decorator that provides `SessionContext` (e.g. `AgentSessionProvider`).
 */
export function withMockConversation(messages: MockConversationMessage[]): Decorator {
  return (Story) => {
    const { room } = useSessionContext();

    React.useEffect(() => {
      messages.forEach(({ id, from, message }) => {
        const payload = new TextEncoder().encode(
          JSON.stringify({ id, timestamp: Date.now(), message }),
        ) as Uint8Array<ArrayBuffer>;
        // `RoomEvent.DataReceived` is typed as remote-only, but `setupChat` (the only consumer of
        // this event) reads `from` as a plain `Participant`, so this cast is safe -- the real
        // local participant is a `LocalParticipant`, not a `RemoteParticipant` either.
        const participant = (from === 'user'
          ? room.localParticipant
          : MOCK_AGENT_PARTICIPANT) as unknown as RemoteParticipant;
        room.emit(
          RoomEvent.DataReceived,
          payload,
          participant,
          DataPacket_Kind.RELIABLE,
          LEGACY_CHAT_TOPIC,
        );
      });
    }, [room]);

    return <>{Story()}</>;
  };
}
