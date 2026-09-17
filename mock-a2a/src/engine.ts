/**
 * One task: one message and everything the expert does in response.
 *
 * The engine knows nothing about A2A. It expands a script into chat items, hands each to
 * `emit` as it is produced, and returns the outcome. `a2a.ts` turns those into the events
 * of s3.4, so the wire format lives in exactly one place.
 */

import {
  agentHandoff,
  functionCall,
  functionCallOutput,
  message,
  ChatRole,
  type ChatItem,
} from './chat-items.ts';
import { TaskState, type TaskState as TaskStateValue } from './a2a-types.ts';
import type { ConversationStore } from './conversations.ts';
import type { Directive } from './extension.ts';
import { buildScript, type ScenarioName, type Step } from './scenarios.ts';

/**
 * One chat item the expert produced. `text` is set only when the item carries RELAYED
 * TEXT -- text the caller delivers, per s3.4's "which items carry text". `verbatim` marks
 * text to be delivered as written rather than phrased.
 */
export type ProducedItem = { item: ChatItem; text?: string; verbatim?: boolean };

export type TurnOutcome = {
  state: TaskStateValue;
  /** The `answer` artifact. Present for COMPLETED and INPUT_REQUIRED (s3.4). */
  answer?: { text: string; chunks?: string[]; verbatim?: boolean; item: ChatItem };
  /** Terminal status text for FAILED and CANCELED. */
  reason?: string;
  /** COMPLETED only. */
  directive?: Directive;
};

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Expand one step into the items it produces.
 *
 * The `progress` step is the only place the two kinds of caller genuinely diverge (s3.4):
 *
 *   in a delegation      one item  -- the function_call carrying update_of, and the
 *                                    report's OWN WORDS are the relayed text
 *   a person's message   two items -- the same function_call carrying NO text, then an
 *                                    ordinary assistant message with the phrased text
 *
 * A voice agent relays the report itself; a chat client gets the model's phrasing of it,
 * exactly as an ordinary agent would say it.
 */
function expand(step: Step, isDelegation: boolean): ProducedItem[] {
  switch (step.kind) {
    case 'say':
      // session.say() on the expert: delivered as written.
      return [{ item: message(ChatRole.ASSISTANT, step.text), text: step.text, verbatim: true }];

    case 'message':
      return [{ item: message(ChatRole.ASSISTANT, step.text), text: step.text }];

    case 'call':
      // A tool call carries no text.
      return [{ item: functionCall(step.callId, step.name, step.arguments) }];

    case 'progress': {
      const reportCallId = `${step.callId}_update`;
      const report = functionCall(reportCallId, step.name, '{}', { updateOf: step.callId });
      if (isDelegation) {
        return [{ item: report, text: step.text }];
      }
      return [{ item: report }, { item: message(ChatRole.ASSISTANT, step.text), text: step.text }];
    }

    case 'output':
      // A tool result carries no text.
      return [{ item: functionCallOutput(step.callId, step.name, step.output) }];

    case 'handoff':
      // A handoff carries no text.
      return [{ item: agentHandoff(step.from, step.to) }];
  }
}

export type RunTaskParams = {
  contextId: string;
  store: ConversationStore;
  scenario: ScenarioName;
  said: string;
  agentName: string;
  isDelegation: boolean;
  signal: AbortSignal;
  eventDelayMs: number;
  emit: (produced: ProducedItem) => void;
};

export async function runTask(params: RunTaskParams): Promise<TurnOutcome> {
  const { contextId, store, signal, emit } = params;

  // The caller's turn joins the expert's own conversation.
  if (params.said) {
    store.append(contextId, [message(ChatRole.USER, params.said)]);
  }

  const script = buildScript(params.scenario, params.said, params.agentName);
  const delay = script.delayMs ?? params.eventDelayMs;

  let spoken = '';
  let produced = 0;
  let interrupted = false;

  for (const step of script.steps) {
    await sleep(delay, signal);
    if (signal.aborted) {
      interrupted = true;
      break;
    }

    for (const item of expand(step, params.isDelegation)) {
      emit(item);
      store.append(contextId, [item.item]);
      produced += 1;
      if (item.text) spoken = item.text;
    }
  }

  if (interrupted) {
    // s3.5: a cancelled task still reports what landed. Work that finished before the
    // stop stays done, so say which of the two happened.
    const landed = spoken
      ? `What I had so far: ${spoken}`
      : produced > 0
        ? `Got through ${produced} step(s) without saying anything.`
        : 'Stopped before doing anything.';
    return { state: TaskState.CANCELED, reason: `Stopped early. ${landed}` };
  }

  if (script.answer === undefined) {
    return { state: script.state, reason: script.reason };
  }

  // The answer's own chat item. It rides the terminal status as a data part (s3.4) and is
  // the last thing the expert remembers saying.
  const answerItem = message(ChatRole.ASSISTANT, script.answer);
  store.append(contextId, [answerItem]);

  return {
    state: script.state,
    answer: {
      text: script.answer,
      chunks: script.answerChunks,
      verbatim: script.answerVerbatim,
      item: answerItem,
    },
    directive: script.directive,
    reason: script.reason,
  };
}

/** A `close` message: the task completes with no answer and the conversation is dropped. */
export function runClose(contextId: string, store: ConversationStore): TurnOutcome {
  store.close(contextId);
  return { state: TaskState.COMPLETED };
}
