import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { Room, SendTextOptions, ConnectionState } from 'livekit-client';
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
import { type MessagesCallbacks } from './useSessionMessageStore';
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

/** The mode-specific branches only own `send`/`isSending`; the message list lives in the shared store. */
type SessionMessagesBranchReturn = {
  isSending: boolean;
  send: (message: string, options?: SendTextOptions) => Promise<ReceivedChatMessage>;
};

/** @beta */
export function useSessionMessages(session?: UseSessionReturn<SessionMode>): UseSessionMessagesReturn {
  session = useEnsureSession(session);
  const isTextMode = session.mode === 'text';

  // The single source of message state, owned by the session. It survives mode switches and remounts.
  const store = session.internal.messageStore;

  // NOTE: both branch hooks are always called (Rules of Hooks); each is gated by `enabled`. They write
  // into `store` and expose only `send`/`isSending`.
  const rtc = useSessionMessagesRtc(session, !isTextMode);
  const text = useSessionMessagesText(session, isTextMode);

  const active = isTextMode ? text : rtc;

  return React.useMemo(
    () => ({
      messages: store.messages,
      send: active.send,
      isSending: active.isSending,
      internal: { emitter: store.emitter },
    }),
    [store.messages, store.emitter, active.send, active.isSending],
  );
}

/**
 * The RTC (livekit room) implementation of useSessionMessages. Derives messages from the room's
 * transcriptions + chat and mirrors them into the session's shared message store.
 * @internal
 */
function useSessionMessagesRtc(
  session: UseSessionReturn<SessionMode>,
  enabled: boolean,
): SessionMessagesBranchReturn {
  const store = session.internal.messageStore;

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

  // Mirror the derived messages into the shared store. Loop-safe: the deps are the input observables
  // (stable references until their content changes), `upsertMessages` is a stable callback, and the
  // store's equality short-circuit avoids redundant renders. Disabled branch (text mode / synthetic
  // room) upserts nothing.
  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    store.upsertMessages([...transcriptionMessages, ...chat.chatMessages]);
  }, [enabled, transcriptionMessages, chat.chatMessages, store]);

  return React.useMemo(
    () => ({ send: chat.send, isSending: chat.isSending }),
    [chat.send, chat.isSending],
  );
}

/**
 * The text-mode (A2A over HTTP) implementation of useSessionMessages. Upserts sent + streamed
 * messages into the session's shared message store.
 * @internal
 */
function useSessionMessagesText(
  session: UseSessionReturn<SessionMode>,
  enabled: boolean,
): SessionMessagesBranchReturn {
  const store = session.internal.messageStore;
  const textTransport = session.mode === 'text' ? session.textTransport : null;

  const [isSending, setIsSending] = React.useState(false);

  const send = React.useCallback(
    async (message: string, _options?: SendTextOptions): Promise<ReceivedChatMessage> => {
      if (!textTransport) {
        throw new Error('useSessionMessages: text transport is not available');
      }

      const initialUserMessage: ReceivedChatMessage = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        message,
        attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: 'user' },
      };
      store.upsertMessage(initialUserMessage);

      setIsSending(true);
      const stream = await textTransport.requestMessageStream(message);
      setIsSending(false);

      (async () => {
        try {
          for await (const streamedMessage of stream) {
            store.upsertMessage(streamedMessage);
          }
        } catch (err) {
          // FIXME: figure out how to handle errors here, should these somehow put the agent into an
          // errored state?
          log.warn('useSessionMessages: text message stream failed', err);
        }
      })();

      return initialUserMessage;
    },
    [textTransport, store],
  );

  const disabledSend = React.useCallback(async (): Promise<ReceivedChatMessage> => {
    throw new Error('useSessionMessages: text mode is not enabled for this session');
  }, []);

  return React.useMemo(
    () => ({
      isSending: enabled ? isSending : false,
      send: enabled ? send : disabledSend,
    }),
    [enabled, isSending, send, disabledSend],
  );
}
