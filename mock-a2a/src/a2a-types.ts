/**
 * A2A v1.0.1 wire types, transcribed from the normative proto:
 * https://raw.githubusercontent.com/a2aproject/A2A/v1.0.1/specification/a2a.proto
 *
 * These are ProtoJSON shapes (lowerCamelCase; that proto carries no json_name overrides),
 * which is what the HTTP+JSON binding serves. They are deliberately NOT imported from
 * @a2a-js/sdk, whose exported types are ts-proto in-memory shapes -- Part.content is
 * {$case, value}, role is a numeric enum -- rather than wire shapes.
 *
 * On the `/v1` path segment. The LiveKit extension spec s3.1 says "The card's interface
 * URL is the endpoint prefix plus /v1. Routes: POST /v1/message:stream, ...". That is
 * conformant with A2A v1.0.1, and an earlier comment here claiming otherwise was wrong:
 * `/v1` belongs to the interface BASE URL, not to the method path. A client reads
 * supportedInterfaces[].url = https://host/fare-desk/v1 and appends /message:stream, which
 * is exactly the v1.0 rule. (v0.3.0 put /v1 in the spec-defined path itself; v1.0.0 moved
 * it out. Both end up at the same URL here, which is why the distinction is easy to miss.)
 *
 * Shapes worth remembering, all different from v0.3:
 *   - TaskStatusUpdateEvent has NO `final` field. Terminality is a terminal status.state
 *     followed by the stream closing.
 *   - Message and Part have NO `kind` discriminator; Part is a plain proto oneof.
 *   - TaskState is SCREAMING_SNAKE and reserves 0 for UNSPECIFIED.
 *   - AgentCard has no top-level url/preferredTransport; it has supportedInterfaces, and
 *     security schemes are oneof-wrapped.
 */

export const A2A_CONTENT_TYPE = 'application/a2a+json';
export const AGENT_CARD_PATH = '.well-known/agent-card.json';

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

export function nowIso(): string {
  return new Date().toISOString();
}

/** google.rpc.Status JSON, which is what the v1.0.1 HTTP binding returns for errors. */
export function rpcStatus(code: number, message: string, reason?: string): JsonObject {
  return {
    code,
    message,
    details: reason
      ? [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason,
            domain: 'a2a-protocol.org',
          },
        ]
      : [],
  };
}
