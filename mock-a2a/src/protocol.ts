/**
 * The native LiveKit agent-run protocol, on the wire.
 *
 * `RunRequest` / `RunResponse` / `RunComplete` / `Delegation` / `CancelRunRequest` /
 * `RunError` are NOT in @livekit/protocol yet, so they are hand-written here. Everything
 * they nest (ChatMessage, FunctionCall, FunctionCallOutput, AgentHandoff, ChatContext,
 * AgentSessionState) already ships generated, and we use those classes' fromJson/toJson
 * so the nested encoding is canonical by construction.
 *
 * IMPORTANT -- the generated agent types are namespaced:
 *
 *     import { AgentSession, AgentText } from '@livekit/protocol';
 *     AgentSession.ChatMessage   // livekit.agent.ChatMessage   <- what we want
 *     AgentText.AgentSessionState
 *
 * A top-level `import { ChatMessage }` resolves to `livekit.ChatMessage` (room chat).
 * It is a different message with different fields and it fails silently.
 *
 * Canonical protobuf-JSON rules that bite a hand-written peer, all verified against
 * @livekit/protocol@1.51.0 / @bufbuild/protobuf@1.10.x:
 *
 *   - Default values are OMITTED on write. `RunComplete.State.COMPLETED = 0` and
 *     `ChatRole.DEVELOPER = 0`, so a strictly-canonical server emits no `state` and no
 *     `role` on the common path. A reader MUST treat absent `state` as COMPLETED and
 *     absent `role` as DEVELOPER. We write defaults explicitly unless MOCK_OMIT_DEFAULTS
 *     is set, so a client can be exercised against both.
 *   - `fromJson` THROWS on unknown fields by default; every parse below passes
 *     `ignoreUnknownFields: true`.
 *   - 64-bit ints are JSON strings. `AgentSessionState.version` is uint64 -> "42" on the
 *     wire and a bigint in memory. Both string and number are accepted on read.
 *   - `bytes` is base64. `google.protobuf.Timestamp` is an RFC3339 Z string.
 *   - Field names are lowerCamelCase on the wire; snake_case is also accepted on read,
 *     which is why the readers below check both spellings.
 *   - oneof presence is "exactly one arm's key is present"; an unset oneof is never
 *     emitted, even with emitDefaultValues.
 *   - bufbuild v1 uses methods and these option names: toJson({ emitDefaultValues,
 *     enumAsInteger, useProtoFieldName }), fromJson(json, { ignoreUnknownFields }).
 *     bufbuild v2 is functional and renames emitDefaultValues -> alwaysEmitImplicit.
 */

import { AgentSession, AgentText } from '@livekit/protocol';

export type JsonObject = { [key: string]: unknown };

const READ = { ignoreUnknownFields: true } as const;

/** `RunComplete.State`. COMPLETED is the zero value, hence omittable. */
export const RunCompleteState = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
  INPUT_REQUIRED: 'INPUT_REQUIRED',
} as const;
export type RunCompleteState = (typeof RunCompleteState)[keyof typeof RunCompleteState];

/**
 * `RunError.code`. The design doc specifies "codes as the text protocol has them", so
 * these mirror `livekit.agent.TextMessageErrorCode` exactly. INTERNAL_ERROR is zero.
 */
export const RunErrorCode = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SESSION_STATE_NOT_FOUND: 'SESSION_STATE_NOT_FOUND',
  TEXT_HANDLER_ERROR: 'TEXT_HANDLER_ERROR',
  PROCESS_CLOSED: 'PROCESS_CLOSED',
} as const;
export type RunErrorCode = (typeof RunErrorCode)[keyof typeof RunErrorCode];

export type RunError = { message: string; code: RunErrorCode };

export type RunComplete = {
  state: RunCompleteState;
  /** What the caller repeats to the user. A chat client reads the messages instead. */
  text: string;
  sessionState?: AgentText.AgentSessionState;
  error?: RunError;
};

/** The `oneof input` on RunRequest, decoded. */
export type RunInput =
  | { case: 'text'; text: string }
  | { case: 'delegation'; instruction: string; chatCtx: AgentSession.ChatContext };

export type RunRequest = {
  sessionId: string;
  requestId: string;
  agentName: string;
  /** Application data, given to the handler untouched. A JSON object, as a string. */
  metadata: string;
  sessionState?: AgentText.AgentSessionState;
  input: RunInput;
};

/** The `oneof event` on RunResponse, decoded. */
export type RunEvent =
  | { case: 'message'; message: AgentSession.ChatMessage }
  | {
      case: 'functionCall';
      functionCall: AgentSession.FunctionCall;
      /**
       * `FunctionCall.update_of` (field 6) is in the design doc but not yet in the
       * generated class, so it rides alongside and is attached during encoding. Set when
       * this entry reports the progress of a call that is still running, and names that
       * call. A call and its result never set it.
       */
      updateOf?: string;
    }
  | { case: 'functionCallOutput'; functionCallOutput: AgentSession.FunctionCallOutput }
  | { case: 'agentHandoff'; agentHandoff: AgentSession.AgentHandoff }
  | { case: 'complete'; complete: RunComplete };

export type CancelRunRequest = {
  sessionId: string;
  requestId: string;
  reason: string;
};

export class ProtocolError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ProtocolError';
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// reading
// ---------------------------------------------------------------------------

function object(value: unknown, what: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ProtocolError(400, 'INVALID_ARGUMENT', `${what} must be a JSON object`);
  }
  return value as JsonObject;
}

/** Canonical JSON is lowerCamelCase but readers must also accept the proto spelling. */
function pick(source: JsonObject, camel: string, snake: string): unknown {
  return source[camel] !== undefined ? source[camel] : source[snake];
}

function readString(source: JsonObject, camel: string, snake: string, fallback = ''): string {
  const raw = pick(source, camel, snake);
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw !== 'string') {
    throw new ProtocolError(400, 'INVALID_ARGUMENT', `${camel} must be a string`);
  }
  return raw;
}

function readSessionState(source: JsonObject): AgentText.AgentSessionState | undefined {
  const raw = pick(source, 'sessionState', 'session_state');
  if (raw === undefined || raw === null) return undefined;
  try {
    return AgentText.AgentSessionState.fromJson(raw as never, READ);
  } catch (err) {
    throw new ProtocolError(
      400,
      'INVALID_ARGUMENT',
      `sessionState is not a valid AgentSessionState: ${(err as Error).message}`,
    );
  }
}

function readChatContext(raw: unknown): AgentSession.ChatContext {
  if (raw === undefined || raw === null) return new AgentSession.ChatContext();
  try {
    return AgentSession.ChatContext.fromJson(raw as never, READ);
  } catch (err) {
    throw new ProtocolError(
      400,
      'INVALID_ARGUMENT',
      `delegation.chatCtx is not a valid ChatContext: ${(err as Error).message}`,
    );
  }
}

export function parseRunRequest(
  body: unknown,
  options: { fallbackSessionId?: string } = {},
): RunRequest {
  const source = object(body, 'request body');

  const sessionId = readString(source, 'sessionId', 'session_id', options.fallbackSessionId ?? '');
  if (!sessionId) {
    throw new ProtocolError(
      400,
      'INVALID_ARGUMENT',
      'sessionId is required (or present a token whose video grant names a room)',
    );
  }

  const requestId = readString(source, 'requestId', 'request_id');
  if (!requestId) {
    throw new ProtocolError(400, 'INVALID_ARGUMENT', 'requestId is required');
  }

  // `metadata` is a JSON object serialized to a string. Handing an object here is a
  // common first mistake, so say so rather than silently coercing.
  const rawMetadata = pick(source, 'metadata', 'metadata');
  if (rawMetadata !== undefined && rawMetadata !== null && typeof rawMetadata !== 'string') {
    throw new ProtocolError(
      400,
      'INVALID_ARGUMENT',
      'metadata must be a JSON object encoded AS A STRING, e.g. "{\\"k\\":1}", not an object',
    );
  }
  const metadata = typeof rawMetadata === 'string' && rawMetadata !== '' ? rawMetadata : '{}';

  const hasText = pick(source, 'text', 'text') !== undefined;
  const hasDelegation = pick(source, 'delegation', 'delegation') !== undefined;
  if (hasText && hasDelegation) {
    throw new ProtocolError(
      400,
      'INVALID_ARGUMENT',
      'text and delegation are arms of one oneof; set exactly one',
    );
  }
  if (!hasText && !hasDelegation) {
    throw new ProtocolError(400, 'INVALID_ARGUMENT', 'one of text or delegation is required');
  }

  let input: RunInput;
  if (hasText) {
    input = { case: 'text', text: readString(source, 'text', 'text') };
  } else {
    const delegation = object(pick(source, 'delegation', 'delegation'), 'delegation');
    input = {
      case: 'delegation',
      // A duplex model delegates without saying anything, so an empty instruction is
      // legal and means "answer what the user asked" -- the expert reads chatCtx.
      instruction: readString(delegation, 'instruction', 'instruction'),
      chatCtx: readChatContext(pick(delegation, 'chatCtx', 'chat_ctx')),
    };
  }

  return {
    sessionId,
    requestId,
    agentName: readString(source, 'agentName', 'agent_name'),
    metadata,
    sessionState: readSessionState(source),
    input,
  };
}

export function parseCancelRunRequest(
  body: unknown,
  options: { fallbackSessionId?: string } = {},
): CancelRunRequest {
  const source = object(body, 'request body');
  const sessionId = readString(source, 'sessionId', 'session_id', options.fallbackSessionId ?? '');
  const requestId = readString(source, 'requestId', 'request_id');
  if (!sessionId) throw new ProtocolError(400, 'INVALID_ARGUMENT', 'sessionId is required');
  if (!requestId) throw new ProtocolError(400, 'INVALID_ARGUMENT', 'requestId is required');
  return { sessionId, requestId, reason: readString(source, 'reason', 'reason') };
}

// ---------------------------------------------------------------------------
// writing
// ---------------------------------------------------------------------------

function put(target: JsonObject, key: string, value: string, emitDefaults: boolean): void {
  if (emitDefaults || value !== '') target[key] = value;
}

function encodeRunComplete(complete: RunComplete, emitDefaults: boolean): JsonObject {
  const out: JsonObject = {};
  // COMPLETED is the zero value, so canonical JSON drops it.
  if (emitDefaults || complete.state !== RunCompleteState.COMPLETED) out.state = complete.state;
  put(out, 'text', complete.text, emitDefaults);
  if (complete.sessionState) {
    out.sessionState = complete.sessionState.toJson({ emitDefaultValues: emitDefaults });
  }
  if (complete.error) {
    const error: JsonObject = {};
    put(error, 'message', complete.error.message, emitDefaults);
    // INTERNAL_ERROR is the zero value.
    if (emitDefaults || complete.error.code !== RunErrorCode.INTERNAL_ERROR) {
      error.code = complete.error.code;
    }
    out.error = error;
  }
  return out;
}

export function encodeRunResponse(
  sessionId: string,
  requestId: string,
  event: RunEvent,
  emitDefaults: boolean,
): JsonObject {
  const out: JsonObject = {};
  put(out, 'sessionId', sessionId, emitDefaults);
  put(out, 'requestId', requestId, emitDefaults);
  const write = { emitDefaultValues: emitDefaults };

  switch (event.case) {
    case 'message':
      out.message = event.message.toJson(write);
      break;
    case 'functionCall': {
      const encoded = event.functionCall.toJson(write) as JsonObject;
      // update_of is not on the generated class yet; attach it after encoding.
      if (event.updateOf !== undefined) encoded.updateOf = event.updateOf;
      out.functionCall = encoded;
      break;
    }
    case 'functionCallOutput':
      out.functionCallOutput = event.functionCallOutput.toJson(write);
      break;
    case 'agentHandoff':
      out.agentHandoff = event.agentHandoff.toJson(write);
      break;
    case 'complete':
      out.complete = encodeRunComplete(event.complete, emitDefaults);
      break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// reading a response -- the client side of the wire
// ---------------------------------------------------------------------------

/**
 * Decode one RunResponse frame. This is the mirror of encodeRunResponse and is what a
 * client SDK needs; scripts/client.ts uses it, so it stays honest.
 *
 * Note the two defaults applied here. They are the whole reason this function exists
 * rather than callers reading fields off the JSON directly.
 */
export function decodeRunResponse(frame: unknown): {
  sessionId: string;
  requestId: string;
  event: RunEvent;
} {
  const source = object(frame, 'RunResponse frame');
  const sessionId = readString(source, 'sessionId', 'session_id');
  const requestId = readString(source, 'requestId', 'request_id');

  const message = pick(source, 'message', 'message');
  if (message !== undefined) {
    return {
      sessionId,
      requestId,
      event: {
        case: 'message',
        message: AgentSession.ChatMessage.fromJson(message as never, READ),
      },
    };
  }

  const functionCall = pick(source, 'functionCall', 'function_call');
  if (functionCall !== undefined) {
    const raw = object(functionCall, 'functionCall');
    const updateOf = pick(raw, 'updateOf', 'update_of');
    return {
      sessionId,
      requestId,
      event: {
        case: 'functionCall',
        functionCall: AgentSession.FunctionCall.fromJson(raw as never, READ),
        updateOf: typeof updateOf === 'string' ? updateOf : undefined,
      },
    };
  }

  const functionCallOutput = pick(source, 'functionCallOutput', 'function_call_output');
  if (functionCallOutput !== undefined) {
    return {
      sessionId,
      requestId,
      event: {
        case: 'functionCallOutput',
        functionCallOutput: AgentSession.FunctionCallOutput.fromJson(
          functionCallOutput as never,
          READ,
        ),
      },
    };
  }

  const agentHandoff = pick(source, 'agentHandoff', 'agent_handoff');
  if (agentHandoff !== undefined) {
    return {
      sessionId,
      requestId,
      event: {
        case: 'agentHandoff',
        agentHandoff: AgentSession.AgentHandoff.fromJson(agentHandoff as never, READ),
      },
    };
  }

  const complete = pick(source, 'complete', 'complete');
  if (complete !== undefined) {
    const raw = object(complete, 'complete');
    const state = pick(raw, 'state', 'state');
    const errorRaw = pick(raw, 'error', 'error');
    let error: RunError | undefined;
    if (errorRaw !== undefined) {
      const errorObject = object(errorRaw, 'complete.error');
      const code = pick(errorObject, 'code', 'code');
      error = {
        message: readString(errorObject, 'message', 'message'),
        // INTERNAL_ERROR is the zero value, so an absent code means INTERNAL_ERROR.
        code: (typeof code === 'string' ? code : RunErrorCode.INTERNAL_ERROR) as RunErrorCode,
      };
    }
    return {
      sessionId,
      requestId,
      event: {
        case: 'complete',
        complete: {
          // COMPLETED is the zero value, so an absent state means COMPLETED.
          state: (typeof state === 'string'
            ? state
            : RunCompleteState.COMPLETED) as RunCompleteState,
          text: readString(raw, 'text', 'text'),
          sessionState: readSessionState(raw),
          error,
        },
      },
    };
  }

  throw new ProtocolError(400, 'INVALID_ARGUMENT', 'RunResponse frame sets no event arm');
}
