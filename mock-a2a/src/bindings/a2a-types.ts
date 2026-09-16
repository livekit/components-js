/**
 * A2A v1.0.1 wire types, transcribed from the normative proto:
 * https://raw.githubusercontent.com/a2aproject/A2A/v1.0.1/specification/a2a.proto
 *
 * These are ProtoJSON shapes (lowerCamelCase, no json_name overrides anywhere in that
 * proto), which is what the HTTP+JSON binding actually serves. They are deliberately NOT
 * imported from @a2a-js/sdk: that package's exported types are ts-proto in-memory shapes
 * (Part.content is { $case, value }, role is a numeric enum) rather than wire shapes, and
 * it peers @bufbuild/protobuf v2 while @livekit/protocol is on v1.
 *
 * The design doc's route table quotes v0.3.0 paths ('/<endpoint>/v1/message:stream').
 * A2A v1.0.0 (2026-03-12) dropped the /v1 prefix, so this mock serves the v1.0.1 paths.
 * Dropping /v1 is not a deviation from the doc's design: v1.0.1 gives every RPC a
 * tenant-prefixed additional binding, so '/fare-desk/message:stream' IS the spec's
 * '/{tenant}/message:stream' with tenant = the endpoint name, and AgentInterface has a
 * `tenant` field to declare it.
 *
 * Differences from v0.3 that change the projection:
 *   - TaskStatusUpdateEvent has NO `final` field. Terminality is a terminal status.state
 *     followed by the stream closing.
 *   - Message and Part have NO `kind` discriminator; Part is a plain proto oneof.
 *   - TaskState is SCREAMING_SNAKE and reserves 0 for UNSPECIFIED, so unlike our
 *     RunComplete.State (COMPLETED = 0) it is never dropped by default-value elision.
 *   - AgentCard has no top-level url/preferredTransport/protocolVersion; it has
 *     supportedInterfaces, and security schemes are oneof-wrapped.
 */

import { RunCompleteState } from '../protocol.ts';

export const A2A_PROTOCOL_VERSION = '1.0';
export const A2A_CONTENT_TYPE = 'application/a2a+json';
export const AGENT_CARD_PATH = '.well-known/agent-card.json';

/**
 * The design doc marks the chat context data part `livekit.chat_ctx`. That is not a URI
 * and would not survive A2A extension negotiation, so the payload is keyed under a URI in
 * the part's metadata and the URI is declared in Message.extensions. The bare
 * `livekit.chat_ctx` key is accepted on read as an alias.
 */
export const CHAT_CTX_EXTENSION = 'https://livekit.io/a2a/chat-ctx/v1';
export const CHAT_CTX_ALIAS = 'livekit.chat_ctx';

/** Where request_id rides, since A2A has no field for the caller's id. */
export const REQUEST_ID_METADATA_KEY = 'livekit.request_id';

export type JsonObject = { [key: string]: unknown };

export const Role = {
  UNSPECIFIED: 'ROLE_UNSPECIFIED',
  USER: 'ROLE_USER',
  AGENT: 'ROLE_AGENT',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TaskState = {
  UNSPECIFIED: 'TASK_STATE_UNSPECIFIED',
  SUBMITTED: 'TASK_STATE_SUBMITTED',
  WORKING: 'TASK_STATE_WORKING',
  COMPLETED: 'TASK_STATE_COMPLETED',
  FAILED: 'TASK_STATE_FAILED',
  CANCELED: 'TASK_STATE_CANCELED',
  INPUT_REQUIRED: 'TASK_STATE_INPUT_REQUIRED',
  REJECTED: 'TASK_STATE_REJECTED',
  AUTH_REQUIRED: 'TASK_STATE_AUTH_REQUIRED',
} as const;
export type TaskState = (typeof TaskState)[keyof typeof TaskState];

/** oneof content: text | raw | url | data, plus the sibling fields. */
export type Part = {
  text?: string;
  raw?: string;
  url?: string;
  data?: unknown;
  metadata?: JsonObject;
  filename?: string;
  mediaType?: string;
};

export type Message = {
  messageId: string;
  contextId?: string;
  taskId?: string;
  role: Role;
  parts: Part[];
  metadata?: JsonObject;
  extensions?: string[];
  referenceTaskIds?: string[];
};

export type TaskStatus = {
  state: TaskState;
  message?: Message;
  timestamp?: string;
};

export type Artifact = {
  artifactId: string;
  name?: string;
  description?: string;
  parts: Part[];
  metadata?: JsonObject;
  extensions?: string[];
};

export type Task = {
  id: string;
  contextId?: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: Message[];
  metadata?: JsonObject;
};

export type TaskStatusUpdateEvent = {
  taskId: string;
  contextId: string;
  status: TaskStatus;
  metadata?: JsonObject;
};

export type TaskArtifactUpdateEvent = {
  taskId: string;
  contextId: string;
  artifact: Artifact;
  append?: boolean;
  lastChunk?: boolean;
  metadata?: JsonObject;
};

/** One SSE data frame from message:stream. oneof payload. */
export type StreamResponse =
  | { task: Task }
  | { message: Message }
  | { statusUpdate: TaskStatusUpdateEvent }
  | { artifactUpdate: TaskArtifactUpdateEvent };

export type SendMessageConfiguration = {
  acceptedOutputModes?: string[];
  historyLength?: number;
  returnImmediately?: boolean;
};

export type SendMessageRequest = {
  message: Message;
  configuration?: SendMessageConfiguration;
  metadata?: JsonObject;
};

// ---------------------------------------------------------------------------
// state mapping
// ---------------------------------------------------------------------------

export function toTaskState(state: RunCompleteState): TaskState {
  switch (state) {
    case RunCompleteState.COMPLETED:
      return TaskState.COMPLETED;
    case RunCompleteState.FAILED:
      return TaskState.FAILED;
    case RunCompleteState.CANCELED:
      return TaskState.CANCELED;
    case RunCompleteState.INPUT_REQUIRED:
      return TaskState.INPUT_REQUIRED;
    default:
      return TaskState.COMPLETED;
  }
}

/**
 * The reverse direction, for a client talking to somebody else's A2A agent. Lossy by
 * design: "REJECTED arrives as FAILED, because an agent that declines and an agent that
 * cannot answer leave the caller with the same job. AUTH_REQUIRED arrives as
 * INPUT_REQUIRED." Neither round-trips.
 */
export function fromTaskState(state: TaskState): RunCompleteState {
  switch (state) {
    case TaskState.COMPLETED:
      return RunCompleteState.COMPLETED;
    case TaskState.CANCELED:
      return RunCompleteState.CANCELED;
    case TaskState.INPUT_REQUIRED:
    case TaskState.AUTH_REQUIRED:
      return RunCompleteState.INPUT_REQUIRED;
    case TaskState.FAILED:
    case TaskState.REJECTED:
      return RunCompleteState.FAILED;
    default:
      return RunCompleteState.FAILED;
  }
}

export function isTerminal(state: TaskState): boolean {
  return (
    state === TaskState.COMPLETED ||
    state === TaskState.FAILED ||
    state === TaskState.CANCELED ||
    state === TaskState.REJECTED
  );
}

export function textPart(text: string): Part {
  return { text };
}

export function agentMessage(contextId: string, taskId: string, text: string): Message {
  return {
    messageId: crypto.randomUUID(),
    contextId,
    taskId,
    role: Role.AGENT,
    parts: [textPart(text)],
  };
}
