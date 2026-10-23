import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { SendTextOptions } from 'livekit-client';
import {
  ReceivedMessage,
  ReceivedChatMessage,
  TextStreamData,
  ReceivedUserTranscriptionMessage,
  ReceivedAgentTranscriptionMessage,
  log,
} from '@livekit/components-core';

import { useAgent } from './useAgent';
import { useTranscriptions } from './useTranscriptions';
import { UseSessionReturn } from './useSession';
import type { MessagesCallbacks } from './useSessionMessageStore';
import { useEnsureSession } from '../context';
import { TEXT_CHAT_ROLE_ATTRIBUTE } from '../text-transport/TextTransport';

/** @beta */
export type UseSessionMessagesReturn = {
  messages: Array<ReceivedMessage>;

  /** Is a send operation currently in progress? */
  isSending: boolean;

  send: (message: string, options?: SendTextOptions) => Promise<ReceivedChatMessage>;

  internal: {
    emitter: TypedEventEmitter<MessagesCallbacks>;
  };
};

/**
 * The session's messages: voice transcriptions (data channel) combined with chat messages sent and
 * received over the session's TextTransport (A2A/HTTP). Chat is never sent over the data channel.
 * All messages are accumulated in the session's shared message store so they persist for the life of
 * the session.
 * @beta
 */
export function useSessionMessages(session?: UseSessionReturn): UseSessionMessagesReturn {
  const s = useEnsureSession(session);
  const { room, textTransport } = s;
  // Destructure the stable store operations: the store object's identity changes whenever messages
  // change, so depending on it directly would re-run effects / re-create callbacks on every message.
  const { messages: storeMessages, upsertMessage, upsertMessages, emitter } = s.internal.messageStore;

  const agent = useAgent(session);

  const transcriptions: Array<TextStreamData> = useTranscriptions({ room });

  const transcriptionMessages: Array<
    ReceivedUserTranscriptionMessage | ReceivedAgentTranscriptionMessage
  > = React.useMemo(() => {
    return transcriptions.map((transcription) => {
      switch (transcription.participantInfo.identity) {
        case room.localParticipant.identity:
          return {
            type: 'userTranscript',
            message: transcription.text,

            id: transcription.streamInfo.id,
            timestamp: transcription.streamInfo.timestamp,
            attributes: transcription.streamInfo.attributes,
            from: room.localParticipant,
          };

        case agent.internal.agentParticipant?.identity:
        case agent.internal.workerParticipant?.identity:
          return {
            type: 'agentTranscript',
            message: transcription.text,

            id: transcription.streamInfo.id,
            timestamp: transcription.streamInfo.timestamp,
            attributes: transcription.streamInfo.attributes,
            from:
              agent.internal.agentParticipant?.identity === transcription.participantInfo.identity
                ? agent.internal.agentParticipant
                : agent.internal.workerParticipant!,
          };

        default:
          // FIXME: what should happen if an associated participant is not found?
          //
          // For now, just assume it is an agent transcription, since maybe it is from an agent
          // which disconencted from the room or something like that.
          return {
            type: 'agentTranscript',
            message: transcription.text,

            id: transcription.streamInfo.id,
            timestamp: transcription.streamInfo.timestamp,
            attributes: transcription.streamInfo.attributes,
            from: Array.from(room.remoteParticipants.values()).find(
              (p) => p.identity === transcription.participantInfo.identity,
            ),
          };
      }
    });
  }, [transcriptions, room, agent.internal.agentParticipant, agent.internal.workerParticipant]);

  // Mirror transcriptions into the shared store. Loop-safe: deps are the memoized transcription
  // array (stable until it changes), and the store upsert short-circuits when nothing changed.
  React.useEffect(() => {
    upsertMessages(transcriptionMessages);
  }, [transcriptionMessages, upsertMessages]);

  const [isSending, setIsSending] = React.useState(false);

  const send = React.useCallback(
    async (message: string, _options?: SendTextOptions): Promise<ReceivedChatMessage> => {
      const initialUserMessage: ReceivedChatMessage = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        message,
        attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: 'user' },
      };
      upsertMessage(initialUserMessage);

      setIsSending(true);
      const stream = await textTransport.requestMessageStream(message);
      setIsSending(false);

      (async () => {
        try {
          for await (const streamedMessage of stream) {
            upsertMessage(streamedMessage);
          }
        } catch (err) {
          // FIXME: figure out how to handle errors here, should these somehow put the agent into an
          // errored state?
          log.warn('useSessionMessages: text message stream failed', err);
        }
      })();

      return initialUserMessage;
    },
    [textTransport, upsertMessage],
  );

  return React.useMemo(
    () => ({
      messages: storeMessages,
      send,
      isSending,
      internal: { emitter },
    }),
    [storeMessages, emitter, send, isSending],
  );
}
