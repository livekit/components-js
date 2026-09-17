/**
 * The canned scripts, and how a request selects one.
 *
 * A script is a list of STEPS. The engine expands steps into chat items, because one step
 * can become one item or two depending on who is asking -- see the progress rule in s3.4.
 *
 * Selection order, so every path is reachable from a chat box without a restart:
 *   1. ?scenario= on the query string
 *   2. "mockScenario" inside the request metadata (s3.3: application data, passed through)
 *   3. a keyword as the first word of the text part
 *   4. MOCK_SCENARIO, default `full`
 */

import { config } from './config.ts';
import { DirectiveKind, type Directive } from './extension.ts';
import { TaskState, type TaskState as TaskStateValue } from './a2a-types.ts';

export const SCENARIOS = [
  'full',
  'plain',
  'verbatim',
  'directive-end',
  'directive-escalate',
  'input-required',
  'failed',
  'slow',
  'handoff',
  'tool-only',
  'chunked',
  'bare-message',
] as const;
export type ScenarioName = (typeof SCENARIOS)[number];

export const TRIGGERS: Readonly<Record<string, ScenarioName>> = Object.freeze({
  '/full': 'full',
  '/plain': 'plain',
  '/say': 'verbatim',
  '/end': 'directive-end',
  '/escalate': 'directive-escalate',
  '/ask': 'input-required',
  '/fail': 'failed',
  '/slow': 'slow',
  '/handoff': 'handoff',
  '/toolonly': 'tool-only',
  '/chunks': 'chunked',
});

function isScenario(value: unknown): value is ScenarioName {
  return typeof value === 'string' && (SCENARIOS as readonly string[]).includes(value);
}

export function resolveScenario(
  text: string,
  metadata: Record<string, unknown>,
  queryScenario?: unknown,
): ScenarioName {
  if (isScenario(queryScenario)) return queryScenario;
  if (isScenario(metadata.mockScenario)) return metadata.mockScenario;

  const first = text.trim().split(/\s+/, 1)[0]?.toLowerCase();
  if (first && first in TRIGGERS) return TRIGGERS[first];

  return isScenario(config.defaultScenario) ? config.defaultScenario : 'full';
}

// ---------------------------------------------------------------------------
// steps
// ---------------------------------------------------------------------------

/**
 * `say` is what session.say() produces: text delivered as written, marked lk/verbatim.
 * `progress` is what ctx.update() produces inside a running tool, and is the one step
 * whose shape depends on the caller (s3.4).
 */
export type Step =
  | { kind: 'say'; text: string }
  | { kind: 'message'; text: string }
  | { kind: 'call'; callId: string; name: string; arguments: string }
  | { kind: 'progress'; callId: string; name: string; text: string }
  | { kind: 'output'; callId: string; name: string; output: string }
  | { kind: 'handoff'; from: string; to: string };

export type Script = {
  name: ScenarioName;
  steps: Step[];
  state: TaskStateValue;
  /** The answer artifact's text. Absent for FAILED, which carries a reason instead. */
  answer?: string;
  /** Split the answer artifact across several chunks (append / lastChunk). */
  answerChunks?: string[];
  answerVerbatim?: boolean;
  /** Terminal status text for FAILED and CANCELED. */
  reason?: string;
  directive?: Directive;
  delayMs?: number;
};

const TOOL = 'check_availability';
const ARGS = '{"date": "2026-09-22"}';

export function buildScript(name: ScenarioName, said: string, agentName: string): Script {
  const heard = said.trim();
  const echo = heard ? `You asked: ${JSON.stringify(heard)}.` : 'You sent no words with the ask.';
  const answer = `Tuesday 09:40 is open; the change fee is waived. (${echo})`;

  // MOCK_A2A_GREETING rides in front of every script as a say() message: it is a real
  // chat item, so it produces a WORKING status like any other, and it doubles as a live
  // lk/verbatim example on every run.
  const greeting: Step[] = config.a2aGreeting ? [{ kind: 'say', text: config.a2aGreeting }] : [];
  const lead = (steps: Step[]): Step[] => [...greeting, ...steps];

  switch (name) {
    case 'plain':
    case 'bare-message':
      return {
        name,
        steps: lead([{ kind: 'message', text: answer }]),
        state: TaskState.COMPLETED,
        answer,
      };

    case 'verbatim':
      return {
        name,
        steps: lead([
          { kind: 'say', text: 'Reading you the fare rule exactly as written.' },
          { kind: 'message', text: answer },
        ]),
        state: TaskState.COMPLETED,
        answer: 'Change fees are waived for delays over 120 minutes.',
        answerVerbatim: true,
      };

    case 'directive-end':
      return {
        name,
        steps: lead([{ kind: 'message', text: answer }]),
        state: TaskState.COMPLETED,
        answer,
        directive: { kind: DirectiveKind.END_SESSION, reason: 'caller_done' },
      };

    case 'directive-escalate':
      return {
        name,
        steps: lead([{ kind: 'message', text: 'This needs a human.' }]),
        state: TaskState.COMPLETED,
        answer: 'I am putting you through to an agent who can authorise the refund.',
        directive: { kind: DirectiveKind.ESCALATE, reason: 'refund_over_limit' },
      };

    case 'input-required':
      // Terminal, and it still carries an answer artifact -- the answer IS the question.
      return {
        name,
        steps: lead([]),
        state: TaskState.INPUT_REQUIRED,
        answer: 'Which airport are you flying from?',
      };

    case 'failed':
      // No answer artifact. The terminal status carries the reason as a text part.
      return {
        name,
        steps: lead([
          { kind: 'call', callId: 'c-1', name: TOOL, arguments: ARGS },
          { kind: 'progress', callId: 'c-1', name: TOOL, text: 'Reaching the fare service...' },
        ]),
        state: TaskState.FAILED,
        reason: 'The fare service did not answer, so I could not price that route.',
      };

    case 'slow':
      // Long gaps so a CancelTask has somewhere to land.
      return {
        name,
        steps: lead([
          { kind: 'call', callId: 'c-1', name: TOOL, arguments: ARGS },
          { kind: 'progress', callId: 'c-1', name: TOOL, text: 'Still checking the fare table...' },
          { kind: 'progress', callId: 'c-1', name: TOOL, text: 'Checking change fees...' },
          { kind: 'output', callId: 'c-1', name: TOOL, output: '{"open": true, "fee": 0}' },
          { kind: 'message', text: answer },
        ]),
        state: TaskState.COMPLETED,
        answer,
        delayMs: 2_000,
      };

    case 'handoff':
      return {
        name,
        steps: lead([
          { kind: 'message', text: 'Let me bring in the baggage desk.' },
          { kind: 'handoff', from: agentName, to: 'baggage-desk' },
          { kind: 'message', text: 'Baggage desk here. One bag is included on that fare.' },
        ]),
        state: TaskState.COMPLETED,
        answer: 'One bag is included on that fare.',
      };

    case 'tool-only':
      return {
        name,
        steps: lead([
          { kind: 'call', callId: 'c-1', name: TOOL, arguments: ARGS },
          { kind: 'output', callId: 'c-1', name: TOOL, output: '{"open": true}' },
        ]),
        state: TaskState.COMPLETED,
        answer: 'Checked availability without saying anything on the way.',
      };

    case 'chunked': {
      // s3.4 gives the artifact chunks ("lastChunk = true on the last chunk"), which is
      // this protocol's way to stream text incrementally -- there is no partial-message
      // concept, so an answer arrives in pieces or all at once.
      const words = answer.split(' ');
      const size = Math.max(1, Math.ceil(words.length / 4));
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += size) {
        chunks.push(`${i === 0 ? '' : ' '}${words.slice(i, i + size).join(' ')}`);
      }
      return { name, steps: lead([]), state: TaskState.COMPLETED, answer, answerChunks: chunks };
    }

    case 'full':
    default:
      return {
        name: 'full',
        steps: lead([
          { kind: 'call', callId: 'c-1', name: TOOL, arguments: ARGS },
          { kind: 'progress', callId: 'c-1', name: TOOL, text: "Checking Tuesday's seats now." },
          { kind: 'output', callId: 'c-1', name: TOOL, output: '{"open": true, "fee": 0}' },
          { kind: 'message', text: answer },
        ]),
        state: TaskState.COMPLETED,
        answer,
      };
  }
}
