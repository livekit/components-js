import { type ReceivedChatMessage } from '@livekit/components-core';
import { type TokenSourceResponseObject } from 'livekit-client';
import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';

/**
 * The A2A "LiveKit agents" extension URI. Sending this in the `A2A-Extensions` request header
 * activates the extension; without it the server degrades to plain-text A2A.
 */
export const A2A_AGENTS_EXTENSION_URI = 'https://livekit.io/a2a/ext/agents/v1';

/**
 * Attribute key used on {@link ReceivedChatMessage.attributes} to carry the message role
 * (`"user"`, `"assistant"`) in text mode.
 *
 * FIXME: this is a stopgap. `ReceivedMessage` has no first-class notion of a sender role, and in
 * text mode there are no `Participant` objects to hang identity off of. Downstream code has to read
 * this attribute to tell user messages from agent messages. This should be replaced with a proper
 * message-model change before text mode ships.
 */
export const TEXT_CHAT_ROLE_ATTRIBUTE = 'lk.chat.role';

/**
 * Resolves the base URL of the A2A interface for a given project id. `/v1` is appended to the
 * returned value. The project id is derived from the credentials' `serverUrl`.
 *
 * - For a real agent: `(projectId) => \`https://${projectId}.staging.livekit.cloud/agents/<agent>/default/<endpoint>\``
 * - For the local mock: `() => 'http://localhost:8787/fare-desk'`
 */
export type TextTransportBaseUrl = string | ((projectId: string) => string);

/** Options for constructing a {@link TextTransport}. */
export type TextTransportOptions = {
  /** The A2A interface base URL, or a callback that builds it from the project id. Optional so a
   * voice-only session can still construct a transport; requestMessageStream fails if it is unset. */
  baseUrl?: TextTransportBaseUrl;

  /** Returns the credentials (token + server url) used to authenticate and locate the agent. */
  getCredentials: () => Promise<TokenSourceResponseObject>;

  /**
   * Optional seed conversation id (A2A `contextId`). Normally leave this unset: the agent creates a
   * thread on the first message and returns its id, which the transport then reuses for the rest of
   * the conversation. Passing a `contextId` the server doesn't know about fails with `thread-not-found`.
   */
  threadId?: string;
};

/** Options passed to {@link TextTransport.requestMessageStream}. */
export type RequestMessageStreamOptions = {
  /** Optional external abort signal; aborting it terminates the in-flight request. */
  signal?: AbortSignal;
};

// A minimal, permissive view of the A2A ProtoJSON frame shapes this prototype consumes.
type A2aPart = {
  text?: string;
  data?: unknown;
  metadata?: Record<string, unknown>;
};

type A2aMessage = {
  messageId?: string;
  contextId?: string;
  role?: string;
  parts?: Array<A2aPart>;
};

type A2aArtifact = {
  artifactId: string;
  name: string;
  parts?: Array<A2aPart>;
};

// The `tasks/list` response shape (A2A ProtoJSON), used to load a thread's history.
type A2aTask = {
  id?: string;
  contextId?: string;
  status?: { state?: string; timestamp?: string; message?: A2aMessage };
  history?: Array<A2aMessage>;
};

type A2aListTasksResponse = {
  tasks?: Array<A2aTask>;
  nextPageToken?: string;
};

enum A2aTaskState {
  /** reserved (0); the codec treats it as working */
  Unspecified = 'TASK_STATE_UNSPECIFIED',
  /** Achnowledgement of task by agent */
  Submitted = 'TASK_STATE_SUBMITTED',
  /* Task is in progress (non terminal state) */
  Working = 'TASK_STATE_WORKING',
  /** The task is paused, awaiting user input (stream closes) */
  InputRequired = 'TASK_STATE_INPUT_REQUIRED',
  /** Pauses the task, awaiting auth */
  AuthRequired = 'TASK_STATE_AUTH_REQUIRED',
  /** Task is completed (terminal state) */
  Completed = 'TASK_STATE_COMPLETED',
  /** Task has failed (terminal state) */
  Failed = 'TASK_STATE_FAILED',
  /** Task is cancelled (terminal state) */
  Cancelled = 'TASK_STATE_CANCELED',
  /** Task is rejected (terminal state) */
  Rejected = 'TASK_STATE_REJECTED',
}

// const A2A_TASK_STATE_TERMINAL_STATES = [
//   A2aTaskState.Completed,
//   A2aTaskState.Failed,
//   A2aTaskState.Cancelled,
//   A2aTaskState.Rejected,
// ];

type A2aStreamResponse = {
  /**
   * A bare, self-contained agent message with no task lifecycle. The LiveKit agent never emits this
   * (it always wraps a turn in a task); it is the generic A2A "direct reply" profile, used by agents
   * that don't speak the LiveKit a2a extension. Treat it as a complete message, not a delta.
   */
  message?: A2aMessage;
  task?: {
    contextId: string;
    id: string;
    status: {
      state: A2aTaskState,
      timestamp?: string;
    };
  };
  statusUpdate?: {
    taskId: string;
    contextId: string;
    status: {
      state: A2aTaskState,
      timestamp?: string;
      message?: A2aMessage;
    };
  };
  artifactUpdate?: {
    taskId: string;
    contextId: string;
    artifact: A2aArtifact;
    /** Should the given data in `artifact` append or overwrite the artifact contents? */
    append?: boolean;
    /** Is this the final chunk in the artifact? */
    lastChunk?: boolean;
  };
};

const A2aStreamResponse = {
  getContextId(response: A2aStreamResponse) {
    return (
      response.task?.contextId ??
      response.statusUpdate?.contextId ??
      response.artifactUpdate?.contextId ??
      response.statusUpdate?.status?.message?.contextId ??
      response.message?.contextId
    );
  },
};

// Each SSE `data:` frame is a JSON-RPC envelope wrapping a StreamResponse in `result`.
type JsonRpcStreamFrame = {
  id: number;
  jsonrpc: "2.0";
  result: A2aStreamResponse;
};

type StreamFrame = JsonRpcStreamFrame | A2aStreamResponse;

const StreamFrame = {
  /* Each SSE frame is a JSON-RPC envelope: unwrap `result` (fall back to a bare frame). **/
  extractA2AStreamResponse(frame: StreamFrame): A2aStreamResponse {
    return 'result' in frame ? frame.result : frame;
  },
};

/** Per-request parsing state, reset for each turn. */
type TurnState = {
  /** Accumulated artifact (answer) text, keyed by taskId. */
  artifactText: Map<string /* task id */, string>;
};

/** Derive the project id (first DNS label) from a LiveKit server URL. */
function projectIdFromServerUrl(serverUrl: string): string {
  try {
    // wss:// -> https://, ws:// -> http://
    const host = new URL(serverUrl.replace(/^ws/, 'http')).hostname;
    return host.split('.')[0] ?? '';
  } catch {
    return '';
  }
}

function normalizeRole(roleRaw: string | undefined): 'assistant' | 'user' {
  return roleRaw === 'ROLE_AGENT' || roleRaw === 'agent' || roleRaw === 'assistant'
    ? 'assistant'
    : 'user';
}

const HISTORY_PAGE_SIZE = 100;
// tasks/list defaults historyLength to 0 (no messages) when absent, so request a large window to get
// each task's full per-turn history.
const HISTORY_MESSAGE_LENGTH = 100_000;

/** The A2A status timestamp (RFC3339) of a task as epoch ms, or 0 when absent/unparseable. */
function taskTimestamp(task: A2aTask): number {
  const raw = task.status?.timestamp;
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Map an A2A message (text parts only) to a ReceivedChatMessage, or null when it carries no text. */
function messageToReceivedChatMessage(
  message: A2aMessage,
  timestamp: number,
): ReceivedChatMessage | null {
  if (!message.parts) {
    return null;
  }
  const text = message.parts
    .filter((part) => typeof part.text === 'string' && part.text.length > 0)
    .map((part) => part.text)
    .join('');
  if (!text) {
    return null;
  }
  const role = normalizeRole(message.role);
  return {
    id: message.messageId ?? crypto.randomUUID(),
    message: text,
    timestamp: timestamp || Date.now(),
    attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: role },
  };
}

type TextTransportCallbacks = {
  threadStarted: (threadId: string) => void;
};

/**
 * A framework-agnostic transport that speaks the agents-2.0 A2A protocol (JSON-RPC over HTTP+SSE,
 * plus the LiveKit agents extension). It owns all protocol knowledge — auth, conversation id, JSON-RPC
 * framing, SSE parsing, and mapping A2A messages onto {@link ReceivedChatMessage} — so that consumers
 * (e.g. `useSessionMessages`) stay protocol-agnostic.
 *
 * This is deliberately React-free. The intent is for it to eventually move into client-sdk-js and
 * be usable outside of React.
 */
export class TextTransport extends (EventEmitter as new () => TypedEmitter<TextTransportCallbacks>) {
  private baseUrl?: TextTransportBaseUrl;
  private getCredentials: () => Promise<TokenSourceResponseObject>;
  private cachedToken: string | null = null;
  private resolvedBaseUrl: string | null = null;
  private activeControllers = new Set<AbortController>();
  private nextRequestId = 1;

  // The conversation id. Undefined until the agent assigns one on the first message; reused after.
  private _threadId: string | undefined;

  constructor(options: TextTransportOptions) {
    super();
    this.baseUrl = options.baseUrl;
    this.getCredentials = options.getCredentials;
    this._threadId = options.threadId;
  }

  /** The thread id, once the agent has assigned one. */
  get threadId(): string | undefined {
    return this._threadId;
  }

  /** Prime the transport by fetching credentials and resolving the base URL. "Connecting" in text mode. */
  async connect(): Promise<void> {
    const baseUrl = this.baseUrl;
    if (typeof baseUrl === 'undefined') {
      throw new Error(
        'TextTransport: no baseUrl configured. Set `textBaseUrl` on useSession to send text messages.',
      );
    }
    const { serverUrl, participantToken } = await this.getCredentials();
    this.cachedToken = participantToken;
    const raw =
      typeof baseUrl === 'function' ? baseUrl(projectIdFromServerUrl(serverUrl)) : baseUrl;
    this.resolvedBaseUrl = raw.replace(/\/$/, '');
  }

  /** Abort any in-flight requests and drop the cached credentials. */
  async disconnect(): Promise<void> {
    for (const controller of this.activeControllers) {
      controller.abort();
    }
    this.activeControllers.clear();
    this.cachedToken = null;
    this.resolvedBaseUrl = null;
  }

  /**
   * POST a user message (JSON-RPC `message/stream`) and consume the SSE response, returning a
   * stream containing an entry for every message the agent produces. Resolves once the response
   * stream is fully consumed (or rejects if it fails / is aborted).
   */
  async requestMessageStream(text: string, options: RequestMessageStreamOptions = {}) {
    if (!this.cachedToken || !this.resolvedBaseUrl) {
      await this.connect();
    }
    const token = this.cachedToken!;
    const baseUrl = this.resolvedBaseUrl!;

    const controller = new AbortController();
    this.activeControllers.add(controller);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort);

    this.nextRequestId += 1;
    const messageId = crypto.randomUUID();

    // Omit contextId until the agent has assigned one. Sending an unknown contextId fails with
    // `thread-not-found`; omitting it makes the agent create a thread and return its id.
    const message: Record<string, unknown> = { messageId, role: 'ROLE_USER', parts: [{ text }] };
    if (this._threadId) {
      message.contextId = this._threadId;
    }

    try {
      const response = await fetch(`${baseUrl}/v1`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/a2a+json',
          'A2A-Extensions': A2A_AGENTS_EXTENSION_URI,
          'A2A-Version': '1.0',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: this.nextRequestId,
          method: 'message/stream',
          params: { message },
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`TextTransport.requestMessageStream failed: HTTP ${response.status}`);
      }

      const body = response.body;
      return this.processMessageStreamBody(body);
    } finally {
      options.signal?.removeEventListener('abort', onExternalAbort);
      this.activeControllers.delete(controller);
    }
  }

  private async *processMessageStreamBody(body: ReadableStream<Uint8Array<ArrayBufferLike>>) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const turn: TurnState = {
      artifactText: new Map(),
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line.
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        yield* this.handleEvent(rawEvent, turn);
      }
    }
    if (buffer.trim().length > 0) {
      yield* this.handleEvent(buffer, turn);
    }
  }

  private *handleEvent(rawEvent: string, turn: TurnState) {
    const dataPayload = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trim())
      .join('\n');
    if (!dataPayload) {
      return;
    }

    let envelope: StreamFrame;
    try {
      envelope = JSON.parse(dataPayload) as StreamFrame;
    } catch {
      return;
    }
    console.log('FRAME', envelope);

    const response = StreamFrame.extractA2AStreamResponse(envelope);

    // Capture the agent-assigned conversation id from the first frame that carries one, so later
    // turns reuse it. The agent creates a thread on the first (contextId-less) message.
    const contextId = A2aStreamResponse.getContextId(response);
    if (contextId && !this._threadId) {
      this._threadId = contextId;
      this.emit('threadStarted', this._threadId);
    }

    // // 1. Track task lifecycle
    // if (response.task) {
    //   if (!turn.task) {
    //     turn.task = {
    //       id: response.task.id,
    //       startedAt: null,
    //       endedAt: null,
    //     };
    //   }
    //   if (response.task.status.state === A2aTaskState.Submitted && response.task.status.timestamp) {
    //     turn.task.startedAt = new Date(response.task.status.timestamp);
    //   }
    //   if (A2A_TASK_STATE_TERMINAL_STATES.includes(response.task.status.state) && response.task.status.timestamp) {
    //     turn.task.endedAt = new Date(response.task.status.timestamp);
    //   }
    // }

    // 1. Bare message: a complete, self-contained agent message with no task lifecycle. Emitted by
    // generic A2A agents that don't speak the LiveKit extension (the LiveKit agent never sends it).
    const bareMessage = response.message;
    if (bareMessage?.parts) {
      const text = bareMessage.parts
        .filter((part) => typeof part.text === 'string' && part.text.length > 0)
        .map((part) => part.text)
        .join('');
      if (text) {
        const role = normalizeRole(bareMessage.role);
        yield {
          id: bareMessage.messageId ?? crypto.randomUUID(),
          role,
          message: text,

          // Messages have no timestamp on the wire; stamp with arrival time.
          timestamp: Date.now(),
          attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: role },
        };
      }
    }

    // 2. Status-update messages: progress and intermediate agent text (text parts only).
    const statusMessage = response.statusUpdate?.status?.message;
    if (statusMessage?.parts) {
      const text = statusMessage.parts
        .filter((part) => typeof part.text === 'string' && part.text.length > 0)
        .map((part) => part.text)
        .join('');
      if (text) {
        yield {
          id: statusMessage.messageId ?? crypto.randomUUID(),
          role: normalizeRole(statusMessage.role),
          message: text,

          // Messages have no timestamp on the wire; stamp with arrival time.
          timestamp: Date.now(),
          attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: normalizeRole(statusMessage.role) },
        };
      }
    }

    // 3. Artifact updates: the answer, streamed as append chunks. Accumulate per task and emit under
    // a stable id so the chunks collapse into one updating bubble.
    const artifactUpdate = response.artifactUpdate;
    if (artifactUpdate?.artifact?.parts) {
      const taskId = artifactUpdate.taskId ?? 'artifact';
      const chunk = artifactUpdate.artifact.parts
        .filter((part) => typeof part.text === 'string' && part.text.length > 0)
        .map((part) => part.text)
        .join('');
      const prior = artifactUpdate.append ? (turn.artifactText.get(taskId) ?? '') : '';
      const accumulated = prior + chunk;
      turn.artifactText.set(taskId, accumulated);
      if (accumulated.length > 0) {
        yield {
          id: `artifact:${taskId}`,
          message: accumulated,

          // Messages have no timestamp on the wire; stamp with arrival time.
          timestamp: Date.now(),
          attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: 'assistant' },
        };
      }
    }

    // TODO(text-mode): data parts (delegations/chat-ctx), interruptions, directives, and task
    // lifecycle/error states are still dropped. Supporting them requires extending `ReceivedMessage`.
  }

  /**
   * Load the current thread's message history (A2A `tasks/list`, paginated to the start), oldest
   * message first. Returns an empty array when there is no thread yet. Only `message`-kind text is
   * mapped; tool calls, artifacts and other item kinds are skipped (same scope as the live stream).
   *
   * NOTE: this is the pragmatic interim path — `tasks/list` on the agent endpoint returns per-turn
   * task history, which we flatten in task order. The canonical thread-history API is the agentstore
   * `GetThreadItems`, not yet reachable from the browser; swapping to it stays internal to this method.
   */
  async loadThreadMessages(options: { signal?: AbortSignal } = {}): Promise<Array<ReceivedChatMessage>> {
    if (!this._threadId) {
      return [];
    }
    if (!this.cachedToken || !this.resolvedBaseUrl) {
      await this.connect();
    }
    const token = this.cachedToken!;
    const baseUrl = this.resolvedBaseUrl!;

    const tasks: Array<A2aTask> = [];
    let pageToken: string | undefined;
    do {
      const page = await this.requestTasksPage(baseUrl, token, pageToken, options.signal);
      if (page.tasks) {
        tasks.push(...page.tasks);
      }
      pageToken = page.nextPageToken || undefined;
    } while (pageToken);

    // Oldest turn first; each task's history is already in order.
    tasks.sort((a, b) => taskTimestamp(a) - taskTimestamp(b));

    const messages: Array<ReceivedChatMessage> = [];
    for (const task of tasks) {
      const timestamp = taskTimestamp(task);
      for (const message of task.history ?? []) {
        const received = messageToReceivedChatMessage(message, timestamp);
        if (received) {
          messages.push(received);
        }
      }
      const statusMessage = task.status?.message;
      if (statusMessage) {
        const received = messageToReceivedChatMessage(statusMessage, timestamp);
        if (received) {
          messages.push(received);
        }
      }
    }
    return messages;
  }

  private async requestTasksPage(
    baseUrl: string,
    token: string,
    pageToken: string | undefined,
    signal: AbortSignal | undefined,
  ): Promise<A2aListTasksResponse> {
    const controller = new AbortController();
    this.activeControllers.add(controller);
    const onExternalAbort = () => controller.abort();
    signal?.addEventListener('abort', onExternalAbort);

    try {
      const response = await fetch(`${baseUrl}/v1`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/a2a+json',
          'A2A-Version': '1.0',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: this.nextRequestId++,
          method: 'tasks/list',
          params: {
            contextId: this._threadId,
            historyLength: HISTORY_MESSAGE_LENGTH,
            pageSize: HISTORY_PAGE_SIZE,
            ...(pageToken ? { pageToken } : {}),
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TextTransport.loadThreadMessages failed: HTTP ${response.status}`);
      }

      const envelope = (await response.json()) as {
        result?: A2aListTasksResponse;
        error?: unknown;
      };
      if (envelope.error) {
        throw new Error(
          `TextTransport.loadThreadMessages: JSON-RPC error ${JSON.stringify(envelope.error)}`,
        );
      }
      return envelope.result ?? {};
    } finally {
      signal?.removeEventListener('abort', onExternalAbort);
      this.activeControllers.delete(controller);
    }
  }
}
