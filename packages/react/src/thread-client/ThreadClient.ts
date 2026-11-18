import type { MessageSender, ReceivedMessage } from '@livekit/components-core';

/**
 * A thread (`AT_…`) as the LiveKit Cloud Public API returns it: the protojson form of
 * `livekit.agent.AgentThread.Thread`.
 * @beta
 */
export type AgentThread = {
  threadId: string;
  /** The scope the thread was created in (typically the user's identity). */
  scope?: string;
  attributes?: Record<string, string>;
  /** RFC3339 timestamp. */
  createdAt?: string;
  /** RFC3339 timestamp. */
  lastActive?: string;
  /** `lastActive + idleTtl`; once it passes, the thread and its database are deleted. RFC3339. */
  expiresAt?: string;
  /** A protojson duration, e.g. `"3600s"`. */
  idleTtl?: string;
  /** The thread's database (`DB_…`), created with the thread. */
  databaseId?: string;
};

/** @beta */
export type AgentChatRole = 'DEVELOPER' | 'SYSTEM' | 'USER' | 'ASSISTANT';

/** The protojson form of `livekit.agent.ChatMessage`. @beta */
export type AgentChatMessage = {
  id?: string;
  role?: AgentChatRole;
  /** Only text content exists today; other content kinds may be added later. */
  content?: Array<{ text?: string }>;
  interrupted?: boolean;
  transcriptConfidence?: number | null;
  extra?: Record<string, string>;
  /** RFC3339 timestamp. */
  createdAt?: string;
};

/**
 * One chat item: the protojson form of `livekit.agent.ChatContext.ChatItem`, a oneof keyed by the
 * variant's field name. Only the variant that is set is present.
 * @beta
 */
export type AgentChatItem = {
  message?: AgentChatMessage;
  functionCall?: {
    id?: string;
    callId?: string;
    name?: string;
    arguments?: string;
    createdAt?: string;
  };
  functionCallOutput?: {
    id?: string;
    callId?: string;
    name?: string;
    output?: string;
    isError?: boolean;
    createdAt?: string;
  };
  agentHandoff?: {
    id?: string;
    oldAgentId?: string | null;
    newAgentId?: string;
    createdAt?: string;
  };
  agentConfigUpdate?: {
    id?: string;
    instructions?: string | null;
    toolsAdded?: Array<string>;
    toolsRemoved?: Array<string>;
    createdAt?: string;
  };
};

/** One chat item of one agent in a thread (`livekit.agent.AgentThread.Item`). @beta */
export type AgentThreadItem = {
  agent?: string;
  /** Position in the agent's history (an int64, so it may arrive as a string). */
  seq?: number | string;
  /** The A2A message the item came from. */
  messageId?: string;
  item?: AgentChatItem;
};

/** @beta */
export type AgentTaskStatus = 'UNSPECIFIED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

/** A thread's background task (`livekit.agent.AgentTask.Task`). @beta */
export type AgentTask = {
  taskId: string;
  threadId?: string;
  /** The task's name, as the agent defines it. */
  name?: string;
  status?: AgentTaskStatus;
  /** RFC3339 timestamp. */
  updatedAt?: string;
};

/** Cursor pagination shared by the list calls. @beta */
export type ThreadClientPageOptions = {
  /** The cursor from a previous page's `nextPageToken`; omit to start from the beginning. */
  pageToken?: string;
  /** Maximum results per page; omit to let the server pick. */
  limit?: number;
};

/** A page of results, and the cursor of the next page (`null` on the last page). @beta */
export type ThreadClientPage<T> = {
  results: Array<T>;
  nextPageToken: string | null;
};

/** @beta */
export type ThreadClientCreateOptions = {
  /** Optional scope grouping the thread (typically the user's identity), at most 256 bytes. */
  scope?: string;
  attributes?: Record<string, string>;
  /** How long the thread lives without activity, in seconds. Omit for the server default. */
  idleTtlSeconds?: number;
};

/** @beta */
export type ThreadClientUpdateOptions = {
  /** Merged into the thread's attributes; an empty string value deletes that key. */
  attributes?: Record<string, string>;
  idleTtlSeconds?: number;
};

/** @beta */
export type ThreadClientListOptions = ThreadClientPageOptions & {
  /** The scope to list (required by the server). */
  scope: string;
};

/** @beta */
export type ThreadClientItemsOptions = ThreadClientPageOptions & {
  /** Only one agent's items; omit for every agent's. */
  agent?: string;
  /** Oldest first (`asc`, the default) or latest first (`desc`, paging back). */
  sortOrder?: 'asc' | 'desc';
};

/** @beta */
export type ThreadClientTasksOptions = ThreadClientPageOptions & {
  /** Only tasks in this status; omit for every status. */
  status?: AgentTaskStatus;
};

/** @beta */
export type ThreadClientOptions = {
  /** Per-request timeout. Defaults to 10 seconds. */
  requestTimeoutMilliseconds?: number;
  /**
   * Overrides the Public API base URL that is otherwise derived from `serverUrl` (e.g. to point at a
   * local mock).
   */
  baseUrl?: string;
};

/**
 * The token a {@link ThreadClient} authenticates with: either a fixed token, or a function returning
 * one (called before every request, so it can hand back a refreshed token).
 * @beta
 */
export type ThreadClientToken = string | (() => string | Promise<string>);

/** gRPC status code names, indexed by their numeric code. */
const GRPC_CODE_NAMES = [
  'ok',
  'canceled',
  'unknown',
  'invalid_argument',
  'deadline_exceeded',
  'not_found',
  'already_exists',
  'permission_denied',
  'resource_exhausted',
  'failed_precondition',
  'aborted',
  'out_of_range',
  'unimplemented',
  'internal',
  'unavailable',
  'data_loss',
  'unauthenticated',
];

/** The error code to fall back on when the response body doesn't name one. */
function codeFromHttpStatus(status: number): string {
  switch (status) {
    case 400:
      return 'invalid_argument';
    case 401:
      return 'unauthenticated';
    case 403:
      return 'permission_denied';
    case 404:
      return 'not_found';
    case 409:
      return 'already_exists';
    case 429:
      return 'resource_exhausted';
    case 501:
      return 'unimplemented';
    case 503:
      return 'unavailable';
    case 504:
      return 'deadline_exceeded';
    default:
      return status >= 500 ? 'internal' : 'unknown';
  }
}

/**
 * An error returned by the Public API (or a failed request). `code` is a gRPC-style status name
 * (`not_found`, `permission_denied`, …); `status` is the HTTP status, or 0 when no response arrived.
 * @beta
 */
export class ThreadClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ThreadClientError';
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_REQUEST_TIMEOUT_MILLISECONDS = 10_000;
const STAGING_PUBLIC_API_URL = 'https://beta-api.staging.livekit.cloud';
const PRODUCTION_PUBLIC_API_URL = 'https://beta-api.livekit.cloud';

/** The project id that names the project of the request's token. */
const PROJECT = 'p_';

/**
 * The Public API base URL for a LiveKit server URL: LiveKit Cloud projects use the Cloud Public API,
 * any other (self-hosted) host serves it itself.
 * @beta
 */
export function publicApiUrlFromServerUrl(serverUrl: string): string {
  const httpUrl = serverUrl.replace(/^ws(s?):\/\//, 'http$1://');
  let hostname: string | null = null;
  try {
    hostname = new URL(httpUrl).hostname;
  } catch {
    // Not a URL; fall through to using it as-is.
  }
  if (hostname?.endsWith('.staging.livekit.cloud')) {
    return STAGING_PUBLIC_API_URL;
  }
  if (hostname?.endsWith('.livekit.cloud')) {
    return PRODUCTION_PUBLIC_API_URL;
  }
  return httpUrl.replace(/\/+$/, '');
}

/** Protojson encodes a duration as decimal seconds with an `s` suffix. */
function durationFromSeconds(seconds: number): string {
  return `${seconds}s`;
}

/**
 * A client for a LiveKit project's agent threads (the LiveKit Cloud Public API thread service): list,
 * create, inspect, update and delete threads, and read a thread's chat items and tasks.
 *
 * It authenticates with a LiveKit access token carrying an `agentThread` grant, so it can run in the
 * browser with a token minted by the application's token server — never an API key and secret.
 *
 * Like `TextTransport`, this is deliberately React-free.
 * @beta
 */
export class ThreadClient {
  private readonly baseUrl: string;
  private readonly token: ThreadClientToken;
  private readonly requestTimeoutMilliseconds: number;

  constructor(serverUrl: string, token: ThreadClientToken, options: ThreadClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? publicApiUrlFromServerUrl(serverUrl)).replace(/\/+$/, '');
    this.token = token;
    this.requestTimeoutMilliseconds =
      options.requestTimeoutMilliseconds ?? DEFAULT_REQUEST_TIMEOUT_MILLISECONDS;
  }

  /** Creates a thread (and its database). */
  async create(
    options: ThreadClientCreateOptions = {},
    signal?: AbortSignal,
  ): Promise<AgentThread> {
    const body: Record<string, unknown> = {};
    if (options.scope) {
      body.scope = options.scope;
    }
    if (options.attributes) {
      body.attributes = options.attributes;
    }
    if (typeof options.idleTtlSeconds !== 'undefined') {
      body.idleTtl = durationFromSeconds(options.idleTtlSeconds);
    }
    const res = await this.request<{ thread?: AgentThread }>('POST', '/threads', {
      body,
      signal,
    });
    return this.requireThread(res.thread);
  }

  async get(threadId: string, signal?: AbortSignal): Promise<AgentThread> {
    const res = await this.request<{ thread?: AgentThread }>(
      'GET',
      `/threads/${encodeURIComponent(threadId)}`,
      { signal },
    );
    return this.requireThread(res.thread);
  }

  /** One page of a scope's threads, newest first. */
  async list(
    options: ThreadClientListOptions,
    signal?: AbortSignal,
  ): Promise<ThreadClientPage<AgentThread>> {
    const res = await this.request<{ items?: Array<AgentThread>; pageInfo?: PageInfo }>(
      'GET',
      '/threads',
      { query: { scope: options.scope, ...pageQuery(options) }, signal },
    );
    return { results: res.items ?? [], nextPageToken: nextPageToken(res.pageInfo) };
  }

  /** Every thread of a scope, newest first, following the pagination cursor. */
  async *listAll(
    options: Omit<ThreadClientListOptions, 'pageToken'>,
    signal?: AbortSignal,
  ): AsyncGenerator<AgentThread> {
    yield* this.paginate((pageToken) => this.list({ ...options, pageToken }, signal));
  }

  /** Merges attributes (an empty value deletes the key) and sets the idle TTL. */
  async update(
    threadId: string,
    options: ThreadClientUpdateOptions,
    signal?: AbortSignal,
  ): Promise<AgentThread> {
    const body: Record<string, unknown> = {};
    if (options.attributes) {
      body.attributes = options.attributes;
    }
    if (typeof options.idleTtlSeconds !== 'undefined') {
      body.idleTtl = durationFromSeconds(options.idleTtlSeconds);
    }
    const res = await this.request<{ thread?: AgentThread }>(
      'PATCH',
      `/threads/${encodeURIComponent(threadId)}`,
      { body, signal },
    );
    return this.requireThread(res.thread);
  }

  /** Deletes the thread and its database. */
  async delete(threadId: string, signal?: AbortSignal): Promise<void> {
    await this.request('DELETE', `/threads/${encodeURIComponent(threadId)}`, { signal });
  }

  /** One page of a thread's chat items, oldest first unless `sortOrder` says otherwise. */
  async items(
    threadId: string,
    options: ThreadClientItemsOptions = {},
    signal?: AbortSignal,
  ): Promise<ThreadClientPage<AgentThreadItem>> {
    const query: Record<string, string | undefined> = { ...pageQuery(options) };
    if (options.agent) {
      query.agent = options.agent;
    }
    if (options.sortOrder) {
      query.sortOrder = options.sortOrder === 'desc' ? 'SORT_ORDER_DESC' : 'SORT_ORDER_ASC';
    }
    const res = await this.request<{ items?: Array<AgentThreadItem>; pageInfo?: PageInfo }>(
      'GET',
      `/threads/${encodeURIComponent(threadId)}/items`,
      { query, signal },
    );
    return { results: res.items ?? [], nextPageToken: nextPageToken(res.pageInfo) };
  }

  /** Every chat item of a thread, following the pagination cursor. */
  async *itemsAll(
    threadId: string,
    options: Omit<ThreadClientItemsOptions, 'pageToken'> = {},
    signal?: AbortSignal,
  ): AsyncGenerator<AgentThreadItem> {
    yield* this.paginate((pageToken) => this.items(threadId, { ...options, pageToken }, signal));
  }

  /** One page of a thread's background tasks, oldest first. */
  async tasks(
    threadId: string,
    options: ThreadClientTasksOptions = {},
    signal?: AbortSignal,
  ): Promise<ThreadClientPage<AgentTask>> {
    const query: Record<string, string | undefined> = { ...pageQuery(options) };
    if (options.status) {
      query.status = options.status;
    }
    const res = await this.request<{ items?: Array<AgentTask>; pageInfo?: PageInfo }>(
      'GET',
      `/threads/${encodeURIComponent(threadId)}/tasks`,
      { query, signal },
    );
    return { results: res.items ?? [], nextPageToken: nextPageToken(res.pageInfo) };
  }

  private requireThread(thread: AgentThread | undefined): AgentThread {
    if (!thread) {
      throw new ThreadClientError(0, 'internal', 'ThreadClient: response did not include a thread');
    }
    return thread;
  }

  private async *paginate<T>(
    fetchPage: (pageToken: string | undefined) => Promise<ThreadClientPage<T>>,
  ): AsyncGenerator<T> {
    let pageToken: string | undefined;
    do {
      const page = await fetchPage(pageToken);
      yield* page.results;
      pageToken = page.nextPageToken ?? undefined;
    } while (pageToken);
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options: {
      query?: Record<string, string | undefined>;
      body?: unknown;
      signal?: AbortSignal;
    } = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/v0/projects/${PROJECT}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (typeof value !== 'undefined' && value !== '') {
        url.searchParams.set(key, value);
      }
    }

    const token = typeof this.token === 'function' ? await this.token() : this.token;

    // Abort on either the per-request timeout or the caller's signal.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMilliseconds);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort);

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (typeof options.body !== 'undefined') {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: typeof options.body !== 'undefined' ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted && !options.signal?.aborted) {
        throw new ThreadClientError(
          0,
          'deadline_exceeded',
          `ThreadClient: ${method} ${path} timed out after ${this.requestTimeoutMilliseconds}ms`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', onExternalAbort);
    }

    const text = await response.text();
    if (!response.ok) {
      throw errorFromResponse(response.status, text);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }
}

type PageInfo = { nextCursor?: string; hasMore?: boolean };

function pageQuery(options: ThreadClientPageOptions): Record<string, string | undefined> {
  return {
    'page.cursor': options.pageToken,
    'page.pageSize':
      typeof options.limit !== 'undefined' && options.limit > 0 ? String(options.limit) : undefined,
  };
}

function nextPageToken(pageInfo: PageInfo | undefined): string | null {
  return pageInfo?.nextCursor ? pageInfo.nextCursor : null;
}

/** Map an error response (`{ code, message }`, where `code` is a gRPC code number or name). */
function errorFromResponse(status: number, text: string): ThreadClientError {
  let code: string | null = null;
  let message = text;
  try {
    const body = JSON.parse(text) as { code?: unknown; message?: unknown };
    if (typeof body.code === 'number') {
      code = GRPC_CODE_NAMES[body.code] ?? null;
    } else if (typeof body.code === 'string' && body.code.length > 0) {
      code = body.code;
    }
    if (typeof body.message === 'string' && body.message.length > 0) {
      message = body.message;
    }
  } catch {
    // Not JSON; keep the raw text as the message.
  }
  return new ThreadClientError(status, code ?? codeFromHttpStatus(status), message);
}

/** An RFC3339 timestamp as epoch ms, or 0 when absent or unparseable. */
function epochMilliseconds(timestamp: string | undefined): number {
  const parsed = timestamp ? Date.parse(timestamp) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** The {@link MessageSender} of a chat message role. */
function senderFromChatRole(role: AgentChatRole | undefined): MessageSender {
  switch (role) {
    case 'USER':
      return { origin: 'user', role: 'user' };
    case 'ASSISTANT':
      return { origin: 'agent', role: 'assistant' };
    case 'SYSTEM':
      return { origin: 'system', role: 'system' };
    case 'DEVELOPER':
      return { origin: 'system', role: 'developer' };
    default:
      return {};
  }
}

/** Everything the agent itself produced (tool calls, handoffs, config updates) is sent by the agent. */
const AGENT_SENDER = { origin: 'agent', role: 'assistant' } as const;

/**
 * Map a thread chat item onto a {@link ReceivedMessage}: text messages (from any role, including system
 * and developer instructions) become chat messages, and every other item kind maps to its own variant.
 * Returns null only for an item that carries no known kind.
 * @beta
 */
export function threadItemToReceivedMessage(item: AgentThreadItem): ReceivedMessage | null {
  const chatItem = item.item;
  // Items without an inner id fall back to their position in the agent's history.
  const fallbackId = `${item.messageId ?? ''}-${item.seq ?? ''}`;

  if (chatItem?.message) {
    const message = chatItem.message;
    return {
      id: message.id || fallbackId,
      message: (message.content ?? []).map((content) => content.text ?? '').join(''),
      timestamp: epochMilliseconds(message.createdAt),
      ...senderFromChatRole(message.role),
    };
  }

  if (chatItem?.functionCall) {
    const call = chatItem.functionCall;
    return {
      type: 'functionCall',
      id: call.id || fallbackId,
      timestamp: epochMilliseconds(call.createdAt),
      callId: call.callId ?? '',
      name: call.name ?? '',
      arguments: call.arguments ?? '',
      ...AGENT_SENDER,
    };
  }

  if (chatItem?.functionCallOutput) {
    const output = chatItem.functionCallOutput;
    return {
      type: 'functionCallOutput',
      id: output.id || fallbackId,
      timestamp: epochMilliseconds(output.createdAt),
      callId: output.callId ?? '',
      name: output.name ?? '',
      output: output.output ?? '',
      isError: output.isError ?? false,
      ...AGENT_SENDER,
    };
  }

  if (chatItem?.agentHandoff) {
    const handoff = chatItem.agentHandoff;
    return {
      type: 'agentHandoff',
      id: handoff.id || fallbackId,
      timestamp: epochMilliseconds(handoff.createdAt),
      oldAgentId: handoff.oldAgentId ?? null,
      newAgentId: handoff.newAgentId ?? '',
      ...AGENT_SENDER,
    };
  }

  if (chatItem?.agentConfigUpdate) {
    const update = chatItem.agentConfigUpdate;
    return {
      type: 'agentConfigUpdate',
      id: update.id || fallbackId,
      timestamp: epochMilliseconds(update.createdAt),
      instructions: update.instructions ?? null,
      toolsAdded: update.toolsAdded ?? [],
      toolsRemoved: update.toolsRemoved ?? [],
      ...AGENT_SENDER,
    };
  }

  return null;
}
