import { type ReceivedChatMessage } from '@livekit/components-core';
import { type TokenSourceResponseObject } from 'livekit-client';

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
  /** The A2A interface base URL, or a callback that builds it from the project id. */
  baseUrl: TextTransportBaseUrl;

  /** Returns the credentials (token + server url) used to authenticate and locate the agent. */
  getCredentials: () => Promise<TokenSourceResponseObject>;

  /**
   * Optional seed conversation id (A2A `contextId`). Normally leave this unset: the agent creates a
   * thread on the first message and returns its id, which the transport then reuses for the rest of
   * the conversation. Passing a `contextId` the server doesn't know about fails with `thread-not-found`.
   */
  contextId?: string;
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
  artifactId?: string;
  name?: string;
  parts?: Array<A2aPart>;
};

type A2aStreamResponse = {
  task?: { contextId?: string };
  statusUpdate?: {
    taskId?: string;
    contextId?: string;
    status?: {
      state?: string;
      message?: A2aMessage;
    };
  };
  artifactUpdate?: {
    taskId?: string;
    contextId?: string;
    artifact?: A2aArtifact;
    append?: boolean;
    lastChunk?: boolean;
  };
};

const A2aStreamResponse = {
  getContextId(response: A2aStreamResponse) {
    return (
      response.task?.contextId ??
      response.statusUpdate?.contextId ??
      response.artifactUpdate?.contextId ??
      response.statusUpdate?.status?.message?.contextId
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

/** Per-request parsing state (dedup + artifact accumulation), reset for each turn. */
type TurnState = {
  /** `${role}\n${text}` keys already emitted this turn — suppresses duplicate frames. */
  seen: Set<string>;
  /** Accumulated artifact (answer) text, keyed by taskId. */
  artifactText: Map<string, string>;
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

/**
 * A framework-agnostic transport that speaks the agents-2.0 A2A protocol (JSON-RPC over HTTP+SSE,
 * plus the LiveKit agents extension). It owns all protocol knowledge — auth, conversation id, JSON-RPC
 * framing, SSE parsing, and mapping A2A messages onto {@link ReceivedChatMessage} — so that consumers
 * (e.g. `useSessionMessages`) stay protocol-agnostic.
 *
 * This is deliberately React-free. The intent is for it to eventually move into client-sdk-js and
 * be usable outside of React.
 */
export class TextTransport {
  private baseUrl: TextTransportBaseUrl;
  private getCredentials: () => Promise<TokenSourceResponseObject>;
  private cachedToken: string | null = null;
  private resolvedBaseUrl: string | null = null;
  private activeControllers = new Set<AbortController>();
  private nextRequestId = 1;

  // The conversation id. Undefined until the agent assigns one on the first message; reused after.
  private currentContextId: string | undefined;

  constructor(options: TextTransportOptions) {
    this.baseUrl = options.baseUrl;
    this.getCredentials = options.getCredentials;
    this.currentContextId = options.contextId;
  }

  /** The conversation id, once the agent has assigned one. */
  get contextId(): string | undefined {
    return this.currentContextId;
  }

  /** Prime the transport by fetching credentials and resolving the base URL. "Connecting" in text mode. */
  async connect(): Promise<void> {
    const { serverUrl, participantToken } = await this.getCredentials();
    this.cachedToken = participantToken;
    const raw =
      typeof this.baseUrl === 'function'
        ? this.baseUrl(projectIdFromServerUrl(serverUrl))
        : this.baseUrl;
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
  async *requestMessageStream(text: string, options: RequestMessageStreamOptions = {}) {
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
    if (this.currentContextId) {
      message.contextId = this.currentContextId;
    }

    const turn: TurnState = { seen: new Set(), artifactText: new Map() };

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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
    } finally {
      options.signal?.removeEventListener('abort', onExternalAbort);
      this.activeControllers.delete(controller);
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
    if (contextId && !this.currentContextId) {
      this.currentContextId = contextId;
    }


    // 1. Status-update / bare messages: progress and intermediate agent text (text parts only).
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

    // 2. Artifact updates: the answer, streamed as append chunks. Accumulate per task and emit under
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
}
