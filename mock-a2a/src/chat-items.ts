/**
 * Chat items, per s3.7 of the extension spec.
 *
 * "The item format is designed to be the JSON form of the ChatItem message of the LiveKit
 * protocol, livekit.agent.ChatContext.ChatItem. Today it is produced from the framework's
 * ChatContext, and the protocol definition will carry the same fields."
 *
 * Today it is NOT that protobuf's canonical JSON, which is why these are hand-written
 * rather than taken from @livekit/protocol. The differences are total:
 *
 *              this spec                        livekit.agent.ChatContext.ChatItem protojson
 *   variant    a `type` discriminator           a protobuf oneof, keyed by field name
 *   role       "user" / "assistant"             "USER" / "ASSISTANT"
 *   content    a list of plain strings          a list of {text: "..."} objects
 *   time       created_at, Unix seconds float   createdAt, an RFC3339 string
 *   case       snake_case                       lowerCamelCase
 *
 * When the protobuf definition catches up, this module is what gets deleted.
 */

export const ChatItemType = {
  MESSAGE: 'message',
  FUNCTION_CALL: 'function_call',
  FUNCTION_CALL_OUTPUT: 'function_call_output',
  AGENT_HANDOFF: 'agent_handoff',
} as const;
export type ChatItemType = (typeof ChatItemType)[keyof typeof ChatItemType];

export const ChatRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  DEVELOPER: 'developer',
} as const;
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

type Common = { id: string; created_at: number };

export type MessageItem = Common & {
  type: 'message';
  role: ChatRole;
  content: string[];
  interrupted?: boolean;
  extra?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
};

export type FunctionCallItem = Common & {
  type: 'function_call';
  call_id: string;
  name: string;
  /** A JSON object, as a string. */
  arguments: string;
  extra?: Record<string, unknown>;
  /** Names the running call when this item is a progress report rather than a call. */
  update_of?: string;
};

export type FunctionCallOutputItem = Common & {
  type: 'function_call_output';
  call_id: string;
  name: string;
  output: string;
  is_error?: boolean;
  reply_required?: boolean;
};

export type AgentHandoffItem = Common & {
  type: 'agent_handoff';
  old_agent_id?: string;
  new_agent_id: string;
};

export type ChatItem = MessageItem | FunctionCallItem | FunctionCallOutputItem | AgentHandoffItem;

/** `created_at` is Unix SECONDS, and fractional -- not milliseconds. */
export function nowSeconds(): number {
  return Date.now() / 1000;
}

let sequence = 0;

export function nextId(prefix: string): string {
  sequence += 1;
  return `item_${prefix}${sequence.toString(36)}`;
}

export function message(
  role: ChatRole,
  text: string,
  options: { id?: string; interrupted?: boolean } = {},
): MessageItem {
  return {
    id: options.id ?? nextId('m'),
    type: ChatItemType.MESSAGE,
    role,
    content: [text],
    interrupted: options.interrupted ?? false,
    created_at: nowSeconds(),
  };
}

export function functionCall(
  callId: string,
  name: string,
  args: string,
  options: { id?: string; updateOf?: string } = {},
): FunctionCallItem {
  const item: FunctionCallItem = {
    id: options.id ?? nextId('c'),
    type: ChatItemType.FUNCTION_CALL,
    call_id: callId,
    name,
    arguments: args,
    created_at: nowSeconds(),
  };
  if (options.updateOf !== undefined) item.update_of = options.updateOf;
  return item;
}

export function functionCallOutput(
  callId: string,
  name: string,
  output: string,
  options: { id?: string; isError?: boolean } = {},
): FunctionCallOutputItem {
  return {
    id: options.id ?? nextId('o'),
    type: ChatItemType.FUNCTION_CALL_OUTPUT,
    call_id: callId,
    name,
    output,
    is_error: options.isError ?? false,
    reply_required: false,
    created_at: nowSeconds(),
  };
}

export function agentHandoff(oldAgentId: string, newAgentId: string): AgentHandoffItem {
  return {
    id: nextId('h'),
    type: ChatItemType.AGENT_HANDOFF,
    old_agent_id: oldAgentId,
    new_agent_id: newAgentId,
    created_at: nowSeconds(),
  };
}

/** The text a message item carries, for reading a caller's conversation. */
export function textOf(item: ChatItem): string {
  return item.type === ChatItemType.MESSAGE ? item.content.join('') : '';
}

/**
 * s3.3/s4: "The conversation is sent whole; the expert deduplicates by item id." Add only
 * the items we have not seen, in time order. A delta would require the caller to know what
 * the expert remembers, which a stateless client or a rebuilt expert cannot.
 *
 * Returns the items actually added, so a caller can report how much was new.
 */
export function mergeById(existing: ChatItem[], incoming: ChatItem[]): ChatItem[] {
  const seen = new Set(existing.map((item) => item.id));
  const added = incoming
    .filter((item) => item && typeof item.id === 'string' && !seen.has(item.id))
    .sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
  existing.push(...added);
  return added;
}

/** "the expert answers the last user message in the conversation part" (s3.3). */
export function lastUserText(items: ChatItem[]): string {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    if (item.type !== ChatItemType.MESSAGE) continue;
    if (item.role !== ChatRole.USER) continue;
    const text = textOf(item).trim();
    if (text) return text;
  }
  return '';
}

/** Parse a `chat_ctx` data part: `{"items": [...]}`. Tolerant -- this is a mock. */
export function parseChatCtx(data: unknown): ChatItem[] {
  if (Array.isArray(data)) return data.filter(isChatItem);
  if (typeof data !== 'object' || data === null) return [];
  const items = (data as { items?: unknown }).items;
  return Array.isArray(items) ? items.filter(isChatItem) : [];
}

function isChatItem(value: unknown): value is ChatItem {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { id?: unknown; type?: unknown };
  return typeof candidate.id === 'string' && typeof candidate.type === 'string';
}
