/**
 * One turn of one conversation. Binding-agnostic: it takes a RunRequest and pushes
 * RunResponse events at a callback, so the native binding and the A2A projection are two
 * serializers over the same event stream and cannot drift apart.
 *
 * Rule 1 from the design doc -- "RunComplete ends the run and carries the answer. A
 * caller never guesses at an earlier message. If the stream ends without one, the run
 * failed." -- is why this function, not its callers, emits the terminal event. Every exit
 * path goes through finish().
 */

import { AgentSession } from '@livekit/protocol';
import {
  RunCompleteState,
  RunErrorCode,
  type RunComplete,
  type RunEvent,
  type RunRequest,
} from './protocol.ts';
import { buildScript, chatMessage, inputText, type ScenarioName } from './scenarios.ts';
import { SessionStore, StaleSessionStateError } from './sessions.ts';

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

/** The conversation item a streamed event contributes, if any. */
function chatItem(event: RunEvent): AgentSession.ChatContext_ChatItem | undefined {
  switch (event.case) {
    case 'message':
      return new AgentSession.ChatContext_ChatItem({
        item: { case: 'message', value: event.message },
      });
    case 'functionCall':
      // A progress report is history for the model, so it is recorded like any other.
      return new AgentSession.ChatContext_ChatItem({
        item: { case: 'functionCall', value: event.functionCall },
      });
    case 'functionCallOutput':
      return new AgentSession.ChatContext_ChatItem({
        item: { case: 'functionCallOutput', value: event.functionCallOutput },
      });
    case 'agentHandoff':
      return new AgentSession.ChatContext_ChatItem({
        item: { case: 'agentHandoff', value: event.agentHandoff },
      });
    case 'complete':
      return undefined;
  }
}

export type RunTurnParams = {
  request: RunRequest;
  scenario: ScenarioName;
  signal: AbortSignal;
  store: SessionStore;
  eventDelayMs: number;
  emit: (event: RunEvent) => void;
};

export async function runTurn(params: RunTurnParams): Promise<RunComplete> {
  const { request, scenario, signal, store, emit } = params;
  const { sessionId } = request;

  const finish = (complete: RunComplete): RunComplete => {
    emit({ case: 'complete', complete });
    return complete;
  };

  // The request carries the session state; the handler rebuilds the conversation from it
  // or rejects it as lost. A version mismatch is reported in RunComplete, not as a status
  // code, because by now the stream is already open.
  try {
    store.adopt(sessionId, request.sessionState);
  } catch (err) {
    if (!(err instanceof StaleSessionStateError)) throw err;
    return finish({
      state: RunCompleteState.FAILED,
      text: 'That conversation was not found on this worker. Start a new one.',
      error: { message: err.message, code: RunErrorCode.SESSION_STATE_NOT_FOUND },
    });
  }

  // Record the caller's turn. For a delegation we record the ask, NOT the caller's
  // chat_ctx: "The expert's chat context is not the one in the request... How the
  // caller's conversation enters the expert's is for the implementation to decide."
  const said = inputText(request);
  if (said) {
    store.append(sessionId, [
      new AgentSession.ChatContext_ChatItem({
        item: { case: 'message', value: chatMessage(AgentSession.ChatRole.USER, said) },
      }),
    ]);
  }

  const script = buildScript(request, scenario);
  const perEventDelay = script.delayMs ?? params.eventDelayMs;

  const produced: AgentSession.ChatContext_ChatItem[] = [];
  const seenMessageIds = new Set<string>();
  let spoken = '';
  let interrupted = false;

  for (const event of script.events) {
    await sleep(perEventDelay, signal);
    if (signal.aborted) {
      interrupted = true;
      break;
    }

    emit(event);

    if (event.case === 'message') {
      // The `typing` scenario re-emits one growing message under a single id; keep the
      // latest and record it once.
      spoken = event.message.content
        .map((part) => (part.payload.case === 'text' ? part.payload.value : ''))
        .join('');
      if (seenMessageIds.has(event.message.id)) {
        const at = produced.findIndex(
          (candidate) =>
            candidate.item.case === 'message' && candidate.item.value.id === event.message.id,
        );
        if (at >= 0) produced.splice(at, 1);
      }
      seenMessageIds.add(event.message.id);
    }

    const item = chatItem(event);
    if (item) produced.push(item);
  }

  store.append(sessionId, produced);

  if (interrupted) {
    // Rule 4: a cancelled run still reports what it did. Having spoken nothing is not
    // the same as having done nothing, so a tool-only partial says so.
    const did = spoken
      ? `What I had so far: ${spoken}`
      : produced.length > 0
        ? `Got through ${produced.length} step(s) without speaking.`
        : 'Stopped before doing anything.';
    return finish({
      state: RunCompleteState.CANCELED,
      text: `Stopped early. ${did}`,
      sessionState: store.snapshot(sessionId),
    });
  }

  return finish({
    state: script.state,
    text: script.text,
    sessionState: store.snapshot(sessionId),
    error: script.error,
  });
}
