/**
 * The rules the protobuf types do not carry (design doc s2, "Rules the types do not
 * carry"). These are exactly what a client has to be built against, so the mock enforces
 * them rather than being permissive:
 *
 *   1. RunComplete ends the run and carries the answer -- enforced in engine.ts.
 *   2. Runs of one conversation are taken one at a time, in the order they arrive, so
 *      the second ask sees what the first one did -- the per-session FIFO chain here.
 *   3/4. Cancel is best-effort: work can finish between the decision and the stop, which
 *      is why a cancelled run still reports what it did.
 *
 * Plus "an id that is already live fails" from the RunRequest.request_id comment.
 */

import { AgentSession, AgentText } from '@livekit/protocol';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class DuplicateRequestError extends Error {
  constructor(requestId: string) {
    super(`requestId ${JSON.stringify(requestId)} is already live on this session`);
    this.name = 'DuplicateRequestError';
  }
}

export class StaleSessionStateError extends Error {
  constructor(expected: bigint, received: bigint) {
    super(`session state version mismatch: server holds ${expected}, request carried ${received}`);
    this.name = 'StaleSessionStateError';
  }
}

export class CancelledError extends Error {
  constructor(reason: string) {
    super(reason || 'cancelled by the caller');
    this.name = 'CancelledError';
  }
}

type SessionRecord = {
  chatCtx: AgentSession.ChatContext;
  version: bigint;
  /** Tail of the FIFO chain. Every run on this session awaits its predecessor. */
  tail: Promise<void>;
};

function runKey(sessionId: string, requestId: string): string {
  return `${sessionId} :: ${requestId}`;
}

function restoreChatContext(snapshot: Uint8Array): AgentSession.ChatContext {
  try {
    const parsed: unknown = JSON.parse(decoder.decode(snapshot));
    return AgentSession.ChatContext.fromJson(parsed as never, { ignoreUnknownFields: true });
  } catch {
    // A snapshot we cannot read is the same as no snapshot; the caller's version still
    // governs, so this loses history but never correctness.
    return new AgentSession.ChatContext();
  }
}

export class SessionStore {
  #sessions = new Map<string, SessionRecord>();
  #live = new Map<string, AbortController>();

  #ensure(sessionId: string): SessionRecord {
    let record = this.#sessions.get(sessionId);
    if (!record) {
      record = { chatCtx: new AgentSession.ChatContext(), version: 0n, tail: Promise.resolve() };
      this.#sessions.set(sessionId, record);
    }
    return record;
  }

  has(sessionId: string): boolean {
    return this.#sessions.has(sessionId);
  }

  chatCtx(sessionId: string): AgentSession.ChatContext {
    return this.#ensure(sessionId).chatCtx;
  }

  version(sessionId: string): bigint {
    return this.#ensure(sessionId).version;
  }

  /**
   * "#4337 already does this: the request carries the session state, the handler rebuilds
   * the agent, and the response returns the new state." If we have never seen this
   * conversation but the caller holds a snapshot, rebuild from it. If we have seen it,
   * the caller's version must match ours or the state is lost.
   */
  adopt(sessionId: string, incoming: AgentText.AgentSessionState | undefined): void {
    if (!incoming) return;

    const known = this.#sessions.get(sessionId);
    if (!known || known.version === 0n) {
      const record = this.#ensure(sessionId);
      if (incoming.data.case === 'snapshot') {
        record.chatCtx = restoreChatContext(incoming.data.value);
      }
      record.version = incoming.version;
      return;
    }

    if (known.version !== incoming.version) {
      throw new StaleSessionStateError(known.version, incoming.version);
    }
  }

  /** Append conversation items and bump the version. */
  append(sessionId: string, items: AgentSession.ChatContext_ChatItem[]): void {
    if (items.length === 0) return;
    const record = this.#ensure(sessionId);
    record.chatCtx.items.push(...items);
    record.version += 1n;
  }

  /**
   * The state handed back on RunComplete. The snapshot is the ChatContext as JSON bytes
   * -- deliberately inspectable, so you can base64-decode it while debugging a client.
   */
  snapshot(sessionId: string): AgentText.AgentSessionState {
    const record = this.#ensure(sessionId);
    const json = JSON.stringify(record.chatCtx.toJson());
    return new AgentText.AgentSessionState({
      version: record.version,
      data: { case: 'snapshot', value: encoder.encode(json) },
    });
  }

  /** Rule 2: one run at a time per conversation, in arrival order. */
  enqueue<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
    const record = this.#ensure(sessionId);
    const result = record.tail.then(task, task);
    record.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  /**
   * Claim a request id. Registered synchronously, before the run is queued and before
   * any SSE headers go out, so a duplicate can still be answered with a status code.
   */
  beginRun(sessionId: string, requestId: string): AbortController {
    const key = runKey(sessionId, requestId);
    if (this.#live.has(key)) throw new DuplicateRequestError(requestId);
    const controller = new AbortController();
    this.#live.set(key, controller);
    return controller;
  }

  endRun(sessionId: string, requestId: string): void {
    this.#live.delete(runKey(sessionId, requestId));
  }

  /** Best-effort by design (rule 4): returns false when there is nothing to stop. */
  cancelRun(sessionId: string, requestId: string, reason: string): boolean {
    const controller = this.#live.get(runKey(sessionId, requestId));
    if (!controller) return false;
    controller.abort(new CancelledError(reason));
    return true;
  }
}
