import { type ReceivedChatMessage } from '@livekit/components-core';

/**
 * The A2A "LiveKit Agent Session" extension URI. Sending this in the `A2A-Extensions` request
 * header activates the extension; without it the server silently degrades to plain-text A2A.
 */
export const AGENT_SESSION_EXTENSION_URI = 'https://livekit.io/a2a/ext/agent-session/v1';

/**
 * Attribute key used on {@link ReceivedChatMessage.attributes} to carry the A2A chat-item role
 * (`"user"`, `"assistant"`, ...) in text mode.
 *
 * FIXME: this is a stopgap. `ReceivedMessage` has no first-class notion of a sender role, and in
 * text mode there are no `Participant` objects to hang identity off of. Downstream code has to read
 * this attribute to tell user messages from agent messages. This should be replaced with a proper
 * message-model change before text mode ships.
 */
export const TEXT_CHAT_ROLE_ATTRIBUTE = 'lk.chat.role';

/** Options for constructing a {@link TextTransport}. */
export type TextTransportOptions = {
  /**
   * Fully-qualified base URL of the A2A `v1` interface, e.g.
   * `http://localhost:8787/fare-desk/v1`. `/message:stream` is appended to this.
   */
  baseUrl: string;

  /** Returns a bearer token (a LiveKit participant token) used to authenticate requests. */
  getToken: () => Promise<string>;

  /** Stable conversation id (A2A `contextId`). Ties multiple turns to one conversation. */
  contextId: string;
};

/** Options passed to {@link TextTransport.requestMessageStream}. */
export type RequestMessageStreamOptions = {
  /** Invoked for every normalized message parsed out of the response stream. */
  onMessage: (message: ReceivedChatMessage) => void;

  /** Optional external abort signal; aborting it terminates the in-flight request. */
  signal?: AbortSignal;
};

// A minimal, permissive view of the A2A frame shapes this prototype consumes. The real types
// will live alongside the transport when this moves into client-sdk-js.
type A2aChatItem = {
  id: string;
  type: string;
  role?: string;
  content?: Array<string>;
  created_at?: number;
};

type A2aPart = {
  text?: string;
  data?: A2aChatItem | Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type A2aStreamFrame = {
  task?: unknown;
  artifactUpdate?: unknown;
  statusUpdate?: {
    status?: {
      state?: string;
      message?: { parts?: Array<A2aPart> };
    };
  };
};

/**
 * A framework-agnostic transport that speaks the A2A `message:stream` protocol (plus the LiveKit
 * agent-session extension) over HTTP. It owns all protocol knowledge — auth, conversation id, SSE
 * framing, and mapping A2A chat items onto {@link ReceivedChatMessage} — so that consumers (e.g.
 * `useSessionMessages`) stay protocol-agnostic.
 *
 * This is deliberately React-free. The intent is for it to eventually move into client-sdk-js and
 * be usable outside of React.
 */
export class TextTransport {
  readonly contextId: string;

  private baseUrl: string;
  private getToken: () => Promise<string>;
  private cachedToken: string | null = null;
  private activeControllers = new Set<AbortController>();

  constructor(options: TextTransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.getToken = options.getToken;
    this.contextId = options.contextId;
  }

  /** Prime the transport by fetching (and caching) a token. Represents "connecting" in text mode. */
  async connect(): Promise<void> {
    this.cachedToken = await this.getToken();
  }

  /** Abort any in-flight requests and drop the cached token. */
  async disconnect(): Promise<void> {
    for (const controller of this.activeControllers) {
      controller.abort();
    }
    this.activeControllers.clear();
    this.cachedToken = null;
  }

  /**
   * POST a user message to `message:stream` and consume the SSE response, invoking
   * `onMessage` for every message-kind chat item the agent produces. Resolves once the response
   * stream is fully consumed (or rejects if it fails / is aborted).
   */
  async requestMessageStream(text: string, options: RequestMessageStreamOptions): Promise<void> {
    const token = this.cachedToken ?? (await this.getToken());

    const controller = new AbortController();
    this.activeControllers.add(controller);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort);

    try {
      const response = await fetch(`${this.baseUrl}/message:stream`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/a2a+json',
          'A2A-Extensions': AGENT_SESSION_EXTENSION_URI,
          'A2A-Version': '1.0',
        },
        body: JSON.stringify({
          message: {
            // NOTE: crypto.randomUUID is available in modern browsers and Node 19+.
            messageId: crypto.randomUUID(),
            contextId: this.contextId,
            role: 'ROLE_USER',
            parts: [{ text }],
          },
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
          this.handleEvent(rawEvent, options.onMessage);
        }
      }
      if (buffer.trim().length > 0) {
        this.handleEvent(buffer, options.onMessage);
      }
    } finally {
      options.signal?.removeEventListener('abort', onExternalAbort);
      this.activeControllers.delete(controller);
    }
  }

  private handleEvent(rawEvent: string, onMessage: (message: ReceivedChatMessage) => void) {
    const dataPayload = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trim())
      .join('\n');
    if (!dataPayload) {
      return;
    }

    let frame: A2aStreamFrame;
    try {
      frame = JSON.parse(dataPayload) as A2aStreamFrame;
    } catch {
      return;
    }

    const parts = frame.statusUpdate?.status?.message?.parts;
    if (!parts) {
      return;
    }

    for (const part of parts) {
      const kind = part.metadata?.[`${AGENT_SESSION_EXTENSION_URI}/kind`];
      if (kind !== 'chat_item') {
        continue;
      }
      const item = part.data as A2aChatItem | undefined;

      // TODO(text-mode): only `message` chat items are mapped for now. `function_call`,
      // `function_call_output`, `agent_handoff`, artifact updates, and `lk/directive` events are
      // all dropped. Supporting them requires extending the `ReceivedMessage` model.
      if (!item || item.type !== 'message') {
        continue;
      }

      onMessage({
        id: item.id,
        timestamp:
          typeof item.created_at === 'number' ? Math.round(item.created_at * 1000) : Date.now(),
        message: Array.isArray(item.content) ? item.content.join('') : String(item.content ?? ''),
        attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: String(item.role ?? 'assistant') },
      });
    }
  }
}
