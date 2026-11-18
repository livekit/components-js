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
 * The shared, mode-independent message store owned by a thread.
 *
 * Both the call (voice transcriptions) and text message branches write into this one store, so that
 * starting or ending a call, reconnecting, or remounting the consuming component does NOT clear the
 * accumulated messages. It is exposed on `UseThreadReturn['internal']`.
 * @beta
 */
export type ThreadMessageStore = {
  /** The accumulated messages, sorted by the time they were first received. */
  messages: Array<ReceivedMessage>;

  /** Insert a message, or update it in place if one with the same id already exists. */
  upsertMessage: (message: ReceivedMessage) => void;

  /** Upsert many messages in a single state commit (used by the rtc derive effect). */
  upsertMessages: (messages: Array<ReceivedMessage>) => void;

  /**
   * Insert older messages (given oldest first) ahead of everything already in the store, e.g. a page of
   * history. A message whose id is already present is updated in place and keeps its position.
   */
  prependMessages: (messages: Array<ReceivedMessage>) => void;

  /**
   * Replace the store's contents with `messages` (given oldest first), e.g. after re-fetching history.
   * MessageReceived only fires for ids the store has never seen.
   */
  replaceMessages: (messages: Array<ReceivedMessage>) => void;

  /** Remove all accumulated messages. */
  clear: () => void;

  /** Fires `MessagesEvent.MessageReceived` once per message, at the single write point. */
  emitter: TypedEventEmitter<MessagesCallbacks>;
};

/** Record `id` as seen; returns true the first time it is seen. */
function markSeen(seen: Set<ReceivedMessage['id']>, id: ReceivedMessage['id']) {
  if (seen.has(id)) {
    return false;
  }
  seen.add(id);
  return true;
}

/**
 * Internal hook used by `useThread` to own the thread's message state. Modeled on
 * `useAgentTimeoutIdStore`: it returns a stable set of operations plus a snapshot of the state, which
 * `useThread` places on `internal` so every mode and every consumer shares one instance.
 * @internal
 */
export function useThreadMessageStore(): ThreadMessageStore {
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

  // Publish the map as a list sorted by first-received time, then emit MessageReceived for the ids
  // seen for the first time in this commit.
  const commit = React.useCallback(
    (newlySeenIds: Array<ReceivedMessage['id']>) => {
      const map = messagesMapRef.current;
      const firstReceived = firstReceivedTimeMapRef.current;

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

  const upsertMessages = React.useCallback(
    (incoming: Array<ReceivedMessage>) => {
      const map = messagesMapRef.current;
      const firstReceived = firstReceivedTimeMapRef.current;
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
        if (markSeen(seenIdsRef.current, message.id)) {
          newlySeenIds.push(message.id);
        }
      }

      if (!changed) {
        return;
      }
      commit(newlySeenIds);
    },
    [commit],
  );

  const prependMessages = React.useCallback(
    (incoming: Array<ReceivedMessage>) => {
      const map = messagesMapRef.current;
      const firstReceived = firstReceivedTimeMapRef.current;

      // New ids get first-received times just before the store's earliest, keeping their given order.
      const newMessages = incoming.filter((message) => !map.has(message.id));
      let earliest = Date.now();
      for (const time of firstReceived.values()) {
        earliest = Math.min(earliest, time.getTime());
      }
      newMessages.forEach((message, index) => {
        firstReceived.set(message.id, new Date(earliest - (newMessages.length - index)));
      });

      let changed = false;
      const newlySeenIds: Array<ReceivedMessage['id']> = [];
      for (const message of incoming) {
        if (map.get(message.id) === message) {
          continue;
        }
        map.set(message.id, message);
        changed = true;
        if (markSeen(seenIdsRef.current, message.id)) {
          newlySeenIds.push(message.id);
        }
      }

      if (!changed) {
        return;
      }
      commit(newlySeenIds);
    },
    [commit],
  );

  const replaceMessages = React.useCallback(
    (incoming: Array<ReceivedMessage>) => {
      const map = messagesMapRef.current;
      const firstReceived = firstReceivedTimeMapRef.current;
      map.clear();
      firstReceived.clear();

      // Strictly increasing first-received times, so the given order is the stored order.
      const base = Date.now() - incoming.length;
      const newlySeenIds: Array<ReceivedMessage['id']> = [];
      incoming.forEach((message, index) => {
        map.set(message.id, message);
        firstReceived.set(message.id, new Date(base + index));
        if (markSeen(seenIdsRef.current, message.id)) {
          newlySeenIds.push(message.id);
        }
      });
      commit(newlySeenIds);
    },
    [commit],
  );

  const upsertMessage = React.useCallback(
    (message: ReceivedMessage) => upsertMessages([message]),
    [upsertMessages],
  );

  const clear = React.useCallback(() => {
    if (messagesMapRef.current.size === 0) {
      return;
    }
    messagesMapRef.current.clear();
    firstReceivedTimeMapRef.current.clear();
    seenIdsRef.current.clear();
    setMessages([]);
  }, []);

  return React.useMemo(
    () => ({
      messages,
      upsertMessage,
      upsertMessages,
      prependMessages,
      replaceMessages,
      clear,
      emitter,
    }),
    [messages, upsertMessage, upsertMessages, prependMessages, replaceMessages, clear, emitter],
  );
}
