import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { ReceivedMessage } from '@livekit/components-core';

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

/**
 * The shared, mode-independent message store owned by a session.
 *
 * Both the rtc and text message branches of `useSessionMessages` write into this one store, so that
 * switching a session's mode (text <-> rtc), reconnecting, or remounting the consuming component does
 * NOT clear the accumulated messages. It is exposed on `UseSessionReturn['internal']`.
 * @beta
 */
export type SessionMessageStore = {
  /** The accumulated messages, sorted by the time they were first received. */
  messages: Array<ReceivedMessage>;

  /** Insert a message, or update it in place if one with the same id already exists. */
  upsertMessage: (message: ReceivedMessage) => void;

  /** Upsert many messages in a single state commit (used by the rtc derive effect). */
  upsertMessages: (messages: Array<ReceivedMessage>) => void;

  /** Remove all accumulated messages. */
  clear: () => void;

  /** Fires `MessagesEvent.MessageReceived` once per message, at the single write point. */
  emitter: TypedEventEmitter<MessagesCallbacks>;
};

/**
 * Internal hook used by `useSession` to own the session's message state. Modeled on
 * `useAgentTimeoutIdStore`: it returns a stable set of operations plus a snapshot of the state, which
 * `useSession` places on `internal` so every mode and every consumer shares one instance.
 * @internal
 */
export function useSessionMessageStore(): SessionMessageStore {
  // The canonical collection, keyed by message id.
  const messagesMapRef = React.useRef(new Map<ReceivedMessage['id'], ReceivedMessage>());
  // The time each id was first seen, so ordering is stable as messages update in place.
  const firstReceivedTimeMapRef = React.useRef(new Map<ReceivedMessage['id'], Date>());
  // Ids we have already emitted a MessageReceived for, so we never re-emit on remount.
  const seenIdsRef = React.useRef(new Set<ReceivedMessage['id']>());

  const emitter = React.useMemo(
    () => new EventEmitter() as TypedEventEmitter<MessagesCallbacks>,
    [],
  );

  const [messages, setMessages] = React.useState<Array<ReceivedMessage>>([]);

  const upsertMessages = React.useCallback(
    (incoming: Array<ReceivedMessage>) => {
      const map = messagesMapRef.current;
      const firstReceived = firstReceivedTimeMapRef.current;
      const seen = seenIdsRef.current;
      const now = new Date();

      let changed = false;
      const newlySeenIds: Array<ReceivedMessage['id']> = [];

      for (const message of incoming) {
        // Reference-equal to what we already hold => nothing to do. This is the equality
        // short-circuit that keeps the rtc derive effect from causing redundant renders: memoized
        // transcription/chat objects keep their reference until their content actually changes.
        if (map.get(message.id) === message) {
          continue;
        }
        map.set(message.id, message);
        changed = true;
        if (!firstReceived.has(message.id)) {
          firstReceived.set(message.id, now);
        }
        if (!seen.has(message.id)) {
          seen.add(message.id);
          newlySeenIds.push(message.id);
        }
      }

      if (!changed) {
        return;
      }

      const sorted = Array.from(map.values()).sort((a, b) => {
        const aFirst = firstReceived.get(a.id);
        const bFirst = firstReceived.get(b.id);
        if (typeof aFirst === 'undefined' || typeof bFirst === 'undefined') {
          return 0;
        }
        return aFirst.getTime() - bFirst.getTime();
      });
      setMessages(sorted);

      for (const id of newlySeenIds) {
        const message = map.get(id);
        if (message) {
          emitter.emit(MessagesEvent.MessageReceived, message);
        }
      }
    },
    [emitter],
  );

  const upsertMessage = React.useCallback(
    (message: ReceivedMessage) => upsertMessages([message]),
    [upsertMessages],
  );

  const clear = React.useCallback(() => {
    messagesMapRef.current.clear();
    firstReceivedTimeMapRef.current.clear();
    seenIdsRef.current.clear();
    setMessages([]);
  }, []);

  return React.useMemo(
    () => ({ messages, upsertMessage, upsertMessages, clear, emitter }),
    [messages, upsertMessage, upsertMessages, clear, emitter],
  );
}
