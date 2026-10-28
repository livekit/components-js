import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { SendTextOptions } from 'livekit-client';
import { ReceivedMessage, ReceivedChatMessage, log } from '@livekit/components-core';

import { UseSessionReturn } from './useSession';
import { UseThreadReturn } from './useThread';
import type { MessagesCallbacks } from './useSessionMessageStore';
import { useMaybeSessionContext, useMaybeThreadContext } from '../context';
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
 * A session's messages: voice transcriptions (written into the shared store by the session's call) and
 * chat messages sent and received over the thread's TextTransport (A2A/HTTP). Chat is never sent over
 * the data channel. All messages live in the thread's shared message store so they persist for the life
 * of the conversation.
 *
 * The thread is resolved from the passed session's `internal.thread` back-reference, or from a Thread
 * or Session provider in context.
 * @beta
 */
export function useSessionMessages(session?: UseSessionReturn): UseSessionMessagesReturn {
  const sessionFromContext = useMaybeSessionContext();
  const threadFromContext = useMaybeThreadContext();

  const thread: UseThreadReturn | undefined =
    session?.internal.thread ?? threadFromContext ?? sessionFromContext?.internal.thread;
  if (!thread) {
    throw new Error(
      'useSessionMessages: no session or thread available. Render inside a Session or Thread provider, or pass a session explicitly.',
    );
  }

  const { textTransport } = thread;
  // Destructure the stable store operations: the store object's identity changes whenever messages
  // change, so depending on it directly would re-run effects / re-create callbacks on every message.
  const {
    messages: storeMessages,
    upsertMessage,
    emitter,
  } = thread.internal.messageStore;

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
