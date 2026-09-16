/**
 * The canned responses, and how a request selects one.
 *
 * Selection order, so every path is drivable from a chat box without restarting:
 *   1. a `?scenario=` query param
 *   2. a `mockScenario` key inside the request's `metadata` JSON
 *   3. a leading keyword in the input text (/fail, /ask, ...)
 *   4. MOCK_SCENARIO, default `full`
 */

import { AgentSession, Timestamp } from '@livekit/protocol';
import { config } from './config.ts';
import {
  RunCompleteState,
  RunErrorCode,
  type RunError,
  type RunEvent,
  type RunRequest,
} from './protocol.ts';

export const SCENARIOS = [
  'full',
  'plain',
  'typing',
  'tool-only',
  'handoff',
  'slow',
  'failed',
  'canceled',
  'input-required',
  'stale',
  'bare-message',
] as const;

export type ScenarioName = (typeof SCENARIOS)[number];

/** Keyword triggers, matched against the first token of the input text. */
export const TRIGGERS: Readonly<Record<string, ScenarioName>> = Object.freeze({
  '/plain': 'plain',
  '/typing': 'typing',
  '/toolonly': 'tool-only',
  '/handoff': 'handoff',
  '/slow': 'slow',
  '/fail': 'failed',
  '/cancelme': 'canceled',
  '/ask': 'input-required',
  '/stale': 'stale',
  '/full': 'full',
});

function isScenario(value: unknown): value is ScenarioName {
  return typeof value === 'string' && (SCENARIOS as readonly string[]).includes(value);
}

/** The words of the turn, whichever oneof arm carried them. */
export function inputText(request: RunRequest): string {
  if (request.input.case === 'text') return request.input.text;
  if (request.input.instruction) return request.input.instruction;
  // "an expert that reads chat_ctx then answers the last thing the user asked"
  return lastUserText(request.input.chatCtx);
}

export function lastUserText(chatCtx: AgentSession.ChatContext): string {
  for (let i = chatCtx.items.length - 1; i >= 0; i -= 1) {
    const item = chatCtx.items[i].item;
    if (item.case !== 'message') continue;
    if (item.value.role !== AgentSession.ChatRole.USER) continue;
    const text = item.value.content
      .map((part) => (part.payload.case === 'text' ? part.payload.value : ''))
      .join('')
      .trim();
    if (text) return text;
  }
  return '';
}

export function resolveScenario(request: RunRequest, queryScenario?: unknown): ScenarioName {
  if (isScenario(queryScenario)) return queryScenario;

  try {
    const metadata: unknown = JSON.parse(request.metadata);
    if (metadata && typeof metadata === 'object') {
      const picked = (metadata as Record<string, unknown>).mockScenario;
      if (isScenario(picked)) return picked;
    }
  } catch {
    // metadata is application data; an unparseable value is the caller's business.
  }

  const first = inputText(request).trim().split(/\s+/, 1)[0]?.toLowerCase();
  if (first && first in TRIGGERS) return TRIGGERS[first];

  return isScenario(config.defaultScenario) ? config.defaultScenario : 'full';
}

// ---------------------------------------------------------------------------
// item builders
// ---------------------------------------------------------------------------

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}_${sequence.toString(36)}`;
}

export function chatMessage(
  role: AgentSession.ChatRole,
  text: string,
  id: string = nextId('msg'),
): AgentSession.ChatMessage {
  return new AgentSession.ChatMessage({
    id,
    role,
    // NOTE: the oneof group inside ChatContent is named `payload`, not `content`.
    // Writing `{ content: { case: 'text', ... } }` here serializes to {} with no error.
    content: [{ payload: { case: 'text', value: text } }],
    createdAt: Timestamp.now(),
  });
}

function call(
  callId: string,
  name: string,
  args: string,
  id: string = nextId('fc'),
): AgentSession.FunctionCall {
  return new AgentSession.FunctionCall({
    id,
    callId,
    name,
    arguments: args,
    createdAt: Timestamp.now(),
  });
}

function output(
  callId: string,
  name: string,
  text: string,
  id: string = nextId('fco'),
): AgentSession.FunctionCallOutput {
  return new AgentSession.FunctionCallOutput({
    id,
    callId,
    name,
    output: text,
    isError: false,
    createdAt: Timestamp.now(),
  });
}

/**
 * A progress report. Per the design doc, `ctx.update()` synthesizes a FunctionCall and a
 * FunctionCallOutput for each report a tool makes, and `update_of` marks the FunctionCall
 * as a report while naming the call being reported on. The report's own call id is
 * distinct from the call it reports on, so the pair still matches up.
 */
function progress(reportsOn: string, name: string, text: string): RunEvent[] {
  const reportCallId = `${reportsOn}_u${nextId('')}`;
  return [
    { case: 'functionCall', functionCall: call(reportCallId, name, '{}'), updateOf: reportsOn },
    { case: 'functionCallOutput', functionCallOutput: output(reportCallId, name, text) },
  ];
}

// ---------------------------------------------------------------------------
// the scripts
// ---------------------------------------------------------------------------

export type Script = {
  name: ScenarioName;
  /** Non-terminal events, streamed in order. */
  events: RunEvent[];
  state: RunCompleteState;
  /** RunComplete.text -- "what the caller repeats to the user". */
  text: string;
  error?: RunError;
  /** Per-event delay override, for scenarios that exist to be interrupted. */
  delayMs?: number;
};

const TOOL = 'lookup_fare';

function assistant(text: string, id?: string): RunEvent {
  return { case: 'message', message: chatMessage(AgentSession.ChatRole.ASSISTANT, text, id) };
}

export function buildScript(request: RunRequest, name: ScenarioName): Script {
  const said = inputText(request).trim();
  const echo = said ? `You said: ${JSON.stringify(said)}.` : 'You sent no words with the ask.';
  const answer = `Mock reply from ${request.agentName || 'the mock expert'}. ${echo} The SFO fare is $129.`;

  switch (name) {
    case 'plain':
      return { name, events: [assistant(answer)], state: RunCompleteState.COMPLETED, text: answer };

    case 'typing': {
      // NOT in the spec: RunResponse has no delta field, so partial text has no defined
      // encoding. This emits repeated `message` events sharing one ChatMessage id with
      // growing content, which is the only shape a client could plausibly coalesce.
      const id = nextId('msg');
      const words = answer.split(' ');
      const events: RunEvent[] = [];
      for (let i = 1; i <= words.length; i += 1) {
        events.push(assistant(words.slice(0, i).join(' '), id));
      }
      return { name, events, state: RunCompleteState.COMPLETED, text: answer, delayMs: 60 };
    }

    case 'tool-only': {
      const callId = 'call_1';
      const text = 'Looked up the fare but produced no chat message.';
      return {
        name,
        events: [
          { case: 'functionCall', functionCall: call(callId, TOOL, '{"origin":"SFO"}') },
          {
            case: 'functionCallOutput',
            functionCallOutput: output(callId, TOOL, '{"fare":129,"currency":"USD"}'),
          },
        ],
        state: RunCompleteState.COMPLETED,
        text,
      };
    }

    case 'handoff':
      return {
        name,
        events: [
          assistant('Let me bring in the baggage desk.'),
          {
            case: 'agentHandoff',
            agentHandoff: new AgentSession.AgentHandoff({
              id: nextId('ho'),
              oldAgentId: request.agentName || 'fare-desk',
              newAgentId: 'baggage-desk',
              createdAt: Timestamp.now(),
            }),
          },
          assistant('Baggage desk here. One bag is included on that fare.'),
        ],
        state: RunCompleteState.COMPLETED,
        text: 'One bag is included on that fare.',
      };

    case 'slow': {
      // Long gaps so a cancel has somewhere to land. Left alone, it completes normally.
      const callId = 'call_slow';
      return {
        name,
        events: [
          { case: 'functionCall', functionCall: call(callId, TOOL, '{"origin":"SFO"}') },
          ...progress(callId, TOOL, 'Still checking the fare table...'),
          ...progress(callId, TOOL, 'Checking change fees...'),
          { case: 'functionCallOutput', functionCallOutput: output(callId, TOOL, '{"fare":129}') },
          assistant(answer),
        ],
        state: RunCompleteState.COMPLETED,
        text: answer,
        delayMs: 2_000,
      };
    }

    case 'failed': {
      const callId = 'call_boom';
      return {
        name,
        events: [
          { case: 'functionCall', functionCall: call(callId, TOOL, '{"origin":"SFO"}') },
          ...progress(callId, TOOL, 'Reaching the fare service...'),
        ],
        state: RunCompleteState.FAILED,
        text: 'The fare service did not answer, so I could not price that route.',
        error: {
          message: 'mock failure: the fare service did not answer',
          code: RunErrorCode.TEXT_HANDLER_ERROR,
        },
      };
    }

    case 'canceled': {
      // Rule 3's third case: "or the expert stops its own work".
      const callId = 'call_stop';
      return {
        name,
        events: [
          { case: 'functionCall', functionCall: call(callId, TOOL, '{"origin":"SFO"}') },
          ...progress(callId, TOOL, 'Started pricing, then stopped.'),
        ],
        state: RunCompleteState.CANCELED,
        text: 'I started pricing that route and stopped before finishing.',
      };
    }

    case 'input-required': {
      const question = 'Which airport are you flying from?';
      return {
        name,
        events: [assistant(question)],
        state: RunCompleteState.INPUT_REQUIRED,
        // "the question to put to the user"
        text: question,
      };
    }

    case 'stale':
      return {
        name,
        events: [],
        state: RunCompleteState.FAILED,
        text: 'That conversation was not found on this worker.',
        error: {
          message: 'mock failure: forced stale session state',
          code: RunErrorCode.SESSION_STATE_NOT_FOUND,
        },
      };

    case 'bare-message':
      // Only meaningful on the A2A binding, where it replies with a Message frame and
      // opens no task. On the native binding it behaves like `plain`.
      return { name, events: [assistant(answer)], state: RunCompleteState.COMPLETED, text: answer };

    case 'full':
    default: {
      const callId = 'call_1';
      return {
        name: 'full',
        events: [
          { case: 'functionCall', functionCall: call(callId, TOOL, '{"origin":"SFO"}') },
          ...progress(callId, TOOL, 'Checking the fare table...'),
          {
            case: 'functionCallOutput',
            functionCallOutput: output(callId, TOOL, '{"fare":129,"currency":"USD"}'),
          },
          assistant(answer),
        ],
        state: RunCompleteState.COMPLETED,
        text: answer,
      };
    }
  }
}
