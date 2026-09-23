import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { Room, SendTextOptions, ConnectionState } from 'livekit-client';
import { EventEmitter } from 'events';
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
import { useChat } from './useChat';
import { SessionMode, UseSessionReturn } from './useSession';
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

/** @beta */
export enum MessagesEvent {
  /**
   * Emits when a new message is received from a participant
   * args: (message: ReceivedMessage)
   */
  MessageReceived = 'messageReceived',
}

/** @beta */
export type MessagesCallbacks = {
  [MessagesEvent.MessageReceived]: (message: ReceivedMessage) => void;
};

type SessionMessagesBranchReturn = {
  messages: Array<ReceivedMessage>;
  isSending: boolean;
  send: (message: string, options?: SendTextOptions) => Promise<ReceivedChatMessage>;
};

/** @beta */
export function useSessionMessages(session?: UseSessionReturn<SessionMode>): UseSessionMessagesReturn {
  const s = useEnsureSession(session);
  const isTextMode = s.mode === 'text';

  const emitter = React.useMemo(
    () => new EventEmitter() as TypedEventEmitter<MessagesCallbacks>,
    [],
  );

  // NOTE: both branch hooks are always called (Rules of Hooks); each is gated by `enabled`.
  const rtc = useSessionMessagesRtc(s, !isTextMode);
  const text = useSessionMessagesText(s, isTextMode);

  const active = isTextMode ? text : rtc;
  const receivedMessages = active.messages;

  // Sort messages by the time they were first received. Shared between rtc and text mode so ordering
  // behaves consistently across both.
  const messageFirstReceivedTimeMapRef = React.useRef(new Map<ReceivedMessage['id'], Date>());
  const sortedReceivedMessages = React.useMemo(() => {
    const now = new Date();
    for (const message of receivedMessages) {
      if (messageFirstReceivedTimeMapRef.current.has(message.id)) {
        continue;
      }

      messageFirstReceivedTimeMapRef.current.set(message.id, now);
    }

    return [...receivedMessages].sort((a, b) => {
      const aFirstReceivedAt = messageFirstReceivedTimeMapRef.current.get(a.id);
      const bFirstReceivedAt = messageFirstReceivedTimeMapRef.current.get(b.id);
      if (typeof aFirstReceivedAt === 'undefined' || typeof bFirstReceivedAt === 'undefined') {
        return 0;
      }

      return aFirstReceivedAt.getTime() - bFirstReceivedAt.getTime();
    });
  }, [receivedMessages]);

  const previouslyReceivedMessageIdsRef = React.useRef(new Set());
  React.useEffect(() => {
    for (const message of sortedReceivedMessages) {
      if (previouslyReceivedMessageIdsRef.current.has(message.id)) {
        continue;
      }

      previouslyReceivedMessageIdsRef.current.add(message.id);
      emitter.emit(MessagesEvent.MessageReceived, message);
    }
  }, [sortedReceivedMessages, emitter]);

  return React.useMemo(
    () => ({
      messages: sortedReceivedMessages,
      send: active.send,
      isSending: active.isSending,
      internal: { emitter },
    }),
    [sortedReceivedMessages, active.send, active.isSending, emitter],
  );
}

/**
 * The RTC (livekit room) implementation of useSessionMessages.
 * @internal
 */
function useSessionMessagesRtc(
  session: UseSessionReturn<SessionMode>,
  enabled: boolean,
): SessionMessagesBranchReturn {
  // FIXME(text-mode): useAgent / useChat / useTranscriptions all require a Room, and Rules of Hooks
  // forces them to run even in text mode (where this branch is disabled). We hand them a synthetic,
  // never-connected Room purely to keep them from throwing. useAgent in particular cannot take an
  // `enabled` flag today. THIS MUST BE ADDRESSED before text mode goes anywhere near a release:
  // useAgent should learn about text mode (or become room-optional) so this placeholder can go away.
  const syntheticRoomRef = React.useRef<Room | null>(null);
  if (session.mode !== 'rtc' && !syntheticRoomRef.current) {
    syntheticRoomRef.current = new Room();
  }
  const room = session.mode === 'rtc' ? session.room : syntheticRoomRef.current!;

  const agentStub = React.useMemo(
    () => ({
      // In text mode force "disconnected" so useAgent's timeout machinery never kicks in.
      connectionState: enabled ? session.connectionState : ConnectionState.Disconnected,
      room,
      internal: session.internal,
    }),
    [enabled, session.connectionState, room, session.internal],
  );
  const agent = useAgent(agentStub);

  const transcriptions: Array<TextStreamData> = useTranscriptions({ room, enabled });
  const chatOptions = React.useMemo(() => ({ room, enabled }), [room, enabled]);
  const chat = useChat(chatOptions);

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

  const receivedMessages = React.useMemo(() => {
    const merged: Array<ReceivedMessage> = [...transcriptionMessages, ...chat.chatMessages];
    return merged;
  }, [transcriptionMessages, chat.chatMessages]);

  return React.useMemo(
    () => ({ messages: receivedMessages, send: chat.send, isSending: chat.isSending }),
    [receivedMessages, chat.send, chat.isSending],
  );
}

/**
 * The text-mode (A2A over HTTP) implementation of useSessionMessages.
 * @internal
 */
function useSessionMessagesText(
  session: UseSessionReturn<SessionMode>,
  enabled: boolean,
): SessionMessagesBranchReturn {
  const textTransport = session.mode === 'text' ? session.textTransport : null;

  // Accumulate messages keyed by chat-item id. This dedups repeated items (e.g. the answer message
  // appears on both WORKING and COMPLETED) and gives us update-in-place for free.
  const messagesMapRef = React.useRef(new Map<string, ReceivedChatMessage>());
  const [messages, setMessages] = React.useState<Array<ReceivedChatMessage>>([]);
  const [isSending, setIsSending] = React.useState(false);

  const upsertMessage = React.useCallback((message: ReceivedChatMessage) => {
    messagesMapRef.current.set(message.id, message);
    setMessages(Array.from(messagesMapRef.current.values()));
  }, []);

  const send = React.useCallback(
    async (message: string, _options?: SendTextOptions): Promise<ReceivedChatMessage> => {
      if (!textTransport) {
        throw new Error('useSessionMessages: text transport is not available');
      }

      const userMessage: ReceivedChatMessage = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        message,
        attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: 'user' },
      };
      upsertMessage(userMessage);

      setIsSending(true);
      // Fire off the request stream but do not await it — messages arrive asynchronously via
      // `upsertMessage`. We resolve immediately with the user's own message.
      textTransport
        .requestMessageStream(message, { onMessage: upsertMessage })
        .catch((err) => {
          log.warn('useSessionMessages: text message stream failed', err);
        })
        .finally(() => {
          setIsSending(false);
        });

      return userMessage;
    },
    [textTransport, upsertMessage],
  );

  const disabledSend = React.useCallback(async (): Promise<ReceivedChatMessage> => {
    throw new Error('useSessionMessages: text mode is not enabled for this session');
  }, []);

  return React.useMemo(
    () => ({
      messages: enabled ? messages : [],
      isSending: enabled ? isSending : false,
      send: enabled ? send : disabledSend,
    }),
    [enabled, messages, isSending, send, disabledSend],
  );
}
