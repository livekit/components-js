/**
 * Smoke client. Doubles as the reference for how a client SDK should drive this protocol.
 *
 *   pnpm smoke
 *
 * Exits non-zero if anything fails. Note that EventSource cannot be used for either
 * binding: it is GET-only and both bindings POST, so the stream is read with fetch plus
 * the frame parser below.
 */

import { AgentSession } from '@livekit/protocol';
import { decodeRunResponse, RunCompleteState, type RunEvent } from '../src/protocol.ts';
import { mintToken } from './token.ts';

const BASE = process.env.MOCK_BASE_URL ?? `http://localhost:${process.env.PORT ?? '8787'}`;
const ENDPOINT = (process.env.MOCK_ENDPOINTS ?? 'fare-desk').split(',')[0].trim();

let failures = 0;

function check(ok: boolean, what: string, detail?: unknown): void {
  if (ok) {
    console.log(`  ok    ${what}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${what}${detail === undefined ? '' : ` -- ${JSON.stringify(detail)}`}`);
}

function heading(text: string): void {
  console.log(`\n${text}`);
}

// ---------------------------------------------------------------------------
// SSE framing
// ---------------------------------------------------------------------------

/**
 * Yield the `data:` payload of each SSE frame. Handles multi-line data, CRLF, and
 * comment-only frames (the mock's `: ping` keepalive), which yield nothing.
 */
async function* sseFrames(response: Response): AsyncGenerator<string> {
  if (!response.body) throw new Error('response has no body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    for (;;) {
      const match = /\r?\n\r?\n/.exec(buffer);
      if (!match) break;
      const raw = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);

      const data = raw
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice('data:'.length).replace(/^ /, ''))
        .join('\n');
      if (data) yield data;
    }
  }
}

function textOf(message: AgentSession.ChatMessage): string {
  return message.content
    .map((part) => (part.payload.case === 'text' ? part.payload.value : ''))
    .join('');
}

function describe(event: RunEvent): string {
  switch (event.case) {
    case 'message':
      return `message      ${event.message.id} ${JSON.stringify(textOf(event.message))}`;
    case 'functionCall':
      return event.updateOf
        ? `progress     updateOf=${event.updateOf} call=${event.functionCall.callId}`
        : `functionCall ${event.functionCall.name}(${event.functionCall.arguments})`;
    case 'functionCallOutput':
      return `output       call=${event.functionCallOutput.callId} ${JSON.stringify(
        event.functionCallOutput.output,
      )}`;
    case 'agentHandoff':
      return `handoff      ${event.agentHandoff.oldAgentId} -> ${event.agentHandoff.newAgentId}`;
    case 'complete':
      return `COMPLETE     state=${event.complete.state} text=${JSON.stringify(
        event.complete.text,
      )}${event.complete.error ? ` error=${event.complete.error.code}` : ''}`;
  }
}

// ---------------------------------------------------------------------------
// the native binding
// ---------------------------------------------------------------------------

type NativeRun = { status: number; contentType: string | null; events: RunEvent[] };

async function runNative(options: {
  token: string;
  sessionId: string;
  requestId: string;
  text: string;
  onFirstEvent?: () => void | Promise<void>;
}): Promise<NativeRun> {
  const response = await fetch(`${BASE}/${ENDPOINT}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${options.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: options.sessionId,
      requestId: options.requestId,
      agentName: ENDPOINT,
      metadata: '{}',
      text: options.text,
    }),
  });

  const result: NativeRun = {
    status: response.status,
    contentType: response.headers.get('content-type'),
    events: [],
  };
  if (!response.ok) {
    console.log(`  (body) ${JSON.stringify(await response.json())}`);
    return result;
  }

  let first = true;
  for await (const frame of sseFrames(response)) {
    const { event } = decodeRunResponse(JSON.parse(frame));
    result.events.push(event);
    console.log(`    <- ${describe(event)}`);
    if (first) {
      first = false;
      if (options.onFirstEvent) await options.onFirstEvent();
    }
  }
  return result;
}

function terminal(events: RunEvent[]): Extract<RunEvent, { case: 'complete' }> | undefined {
  const completes = events.filter((event) => event.case === 'complete');
  return completes[0] as Extract<RunEvent, { case: 'complete' }> | undefined;
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

async function testNativeHappyPath(token: string): Promise<void> {
  heading('native binding: a full turn');
  const sessionId = `smoke-${crypto.randomUUID()}`;
  const run = await runNative({
    token,
    sessionId,
    requestId: crypto.randomUUID(),
    text: 'how much to SFO?',
  });

  check(run.status === 200, 'responds 200', run.status);
  check(
    (run.contentType ?? '').includes('text/event-stream'),
    'responds text/event-stream',
    run.contentType,
  );
  check(run.events.length > 1, 'streams more than one event', run.events.length);

  const completes = run.events.filter((event) => event.case === 'complete');
  check(completes.length === 1, 'exactly one complete event', completes.length);
  check(run.events.at(-1)?.case === 'complete', 'complete is the last event');

  const last = terminal(run.events);
  check(
    last?.complete.state === RunCompleteState.COMPLETED,
    'state is COMPLETED',
    last?.complete.state,
  );
  check(Boolean(last?.complete.text), 'complete carries text');
  check(Boolean(last?.complete.sessionState), 'complete carries sessionState');
  check(
    run.events.some((event) => event.case === 'functionCall' && event.updateOf !== undefined),
    'a progress entry sets updateOf',
  );
}

async function testConversationOrdering(token: string): Promise<void> {
  heading('native binding: rule 2 -- one run at a time, in order');
  const sessionId = `smoke-${crypto.randomUUID()}`;

  const first = runNative({
    token,
    sessionId,
    requestId: crypto.randomUUID(),
    text: 'first turn',
  });
  // Fire the second immediately; it must queue behind the first.
  const second = runNative({
    token,
    sessionId,
    requestId: crypto.randomUUID(),
    text: 'second turn',
  });
  const [a, b] = await Promise.all([first, second]);

  check(a.status === 200 && b.status === 200, 'both runs succeed');
  const versionOf = (run: NativeRun): bigint =>
    terminal(run.events)?.complete.sessionState?.version ?? -1n;
  check(versionOf(a) !== versionOf(b), 'the two runs report different session state versions', [
    String(versionOf(a)),
    String(versionOf(b)),
  ]);
  check(versionOf(a) > 0n && versionOf(b) > 0n, 'both runs advanced the conversation', [
    String(versionOf(a)),
    String(versionOf(b)),
  ]);
}

async function testDuplicateAndCancel(token: string): Promise<void> {
  heading('native binding: duplicate requestId, then cancel mid-stream');
  const sessionId = `smoke-${crypto.randomUUID()}`;
  const requestId = crypto.randomUUID();
  let duplicateStatus = 0;
  let cancelStatus = 0;
  let cancelStopped: unknown;

  const run = await runNative({
    token,
    sessionId,
    requestId,
    // /slow leaves long gaps between events so a cancel has somewhere to land.
    text: '/slow price SFO please',
    onFirstEvent: async () => {
      const duplicate = await fetch(`${BASE}/${ENDPOINT}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          requestId,
          agentName: ENDPOINT,
          metadata: '{}',
          text: 'again',
        }),
      });
      duplicateStatus = duplicate.status;
      await duplicate.arrayBuffer();

      const cancel = await fetch(`${BASE}/${ENDPOINT}:cancel`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, requestId, reason: 'smoke test' }),
      });
      cancelStatus = cancel.status;
      cancelStopped = ((await cancel.json()) as { stopped?: unknown }).stopped;
    },
  });

  check(duplicateStatus === 409, 'a live requestId is rejected with 409', duplicateStatus);
  check(cancelStatus === 202, 'cancel responds 202', cancelStatus);
  check(cancelStopped === true, 'cancel reports it stopped a live run', cancelStopped);

  const last = terminal(run.events);
  check(run.events.at(-1)?.case === 'complete', 'a cancelled run still ends with complete');
  check(
    last?.complete.state === RunCompleteState.CANCELED,
    'state is CANCELED',
    last?.complete.state,
  );
  check(Boolean(last?.complete.text), 'a cancelled run still reports what it did');
}

async function testTerminalStates(token: string): Promise<void> {
  heading('native binding: forced terminal states');
  const cases: Array<[string, string]> = [
    ['/fail', RunCompleteState.FAILED],
    ['/ask', RunCompleteState.INPUT_REQUIRED],
    ['/stale', RunCompleteState.FAILED],
    ['/cancelme', RunCompleteState.CANCELED],
  ];
  for (const [trigger, expected] of cases) {
    const run = await runNative({
      token,
      sessionId: `smoke-${crypto.randomUUID()}`,
      requestId: crypto.randomUUID(),
      text: trigger,
    });
    const last = terminal(run.events);
    check(last?.complete.state === expected, `${trigger} -> ${expected}`, last?.complete.state);
  }
}

async function testDelegation(token: string): Promise<void> {
  heading('native binding: a delegation, not a text turn');
  const sessionId = `smoke-deleg-${crypto.randomUUID()}`;
  const asked = 'how much to SFO with two bags?';

  // A duplex model delegates without saying anything, so the instruction is empty and
  // the expert is expected to read chat_ctx and answer the last thing the user asked.
  const response = await fetch(`${BASE}/${ENDPOINT}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      requestId: crypto.randomUUID(),
      agentName: ENDPOINT,
      metadata: '{}',
      delegation: {
        instruction: '',
        chatCtx: {
          items: [
            { message: { id: 'u1', role: 'USER', content: [{ text: asked }] } },
            { message: { id: 'a1', role: 'ASSISTANT', content: [{ text: 'Let me check.' }] } },
          ],
        },
      },
    }),
  });

  check(response.status === 200, 'responds 200', response.status);
  if (!response.ok) {
    console.log(`  (body) ${JSON.stringify(await response.json())}`);
    return;
  }

  const events: RunEvent[] = [];
  for await (const frame of sseFrames(response)) {
    const { event } = decodeRunResponse(JSON.parse(frame));
    events.push(event);
    console.log(`    <- ${describe(event)}`);
  }

  const last = terminal(events);
  check(
    last?.complete.state === RunCompleteState.COMPLETED,
    'state is COMPLETED',
    last?.complete.state,
  );
  check(
    last?.complete.text.includes(asked) === true,
    'an empty instruction falls back to the last user turn in chatCtx',
    last?.complete.text,
  );
}

async function testTypingScenario(token: string): Promise<void> {
  heading('native binding: partial text (an interpretation, not in the spec)');
  const run = await runNative({
    token,
    sessionId: `smoke-typing-${crypto.randomUUID()}`,
    requestId: crypto.randomUUID(),
    text: '/typing price SFO',
  });

  const messages = run.events.filter((event) => event.case === 'message');
  const ids = new Set(messages.map((event) => (event.case === 'message' ? event.message.id : '')));
  check(messages.length > 2, 'streams several message events', messages.length);
  check(ids.size === 1, 'they all share one ChatMessage id', [...ids]);

  const texts = messages.map((event) => (event.case === 'message' ? textOf(event.message) : ''));
  check(
    texts.every((text, i) => i === 0 || text.startsWith(texts[i - 1])),
    'each one extends the previous text',
  );
  check(
    terminal(run.events)?.complete.text === texts.at(-1),
    'the final text matches RunComplete.text',
  );
}

async function testAuth(): Promise<void> {
  heading('auth');
  const noToken = await fetch(`${BASE}/${ENDPOINT}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ requestId: 'x', text: 'hi' }),
  });
  await noToken.arrayBuffer();
  check(noToken.status === 401, 'no token -> 401', noToken.status);

  const badToken = await fetch(`${BASE}/${ENDPOINT}`, {
    method: 'POST',
    headers: { authorization: 'Bearer not.a.jwt', 'content-type': 'application/json' },
    body: JSON.stringify({ requestId: 'x', text: 'hi' }),
  });
  await badToken.arrayBuffer();
  check(badToken.status === 401, 'malformed token -> 401', badToken.status);
}

async function testAgentCard(): Promise<void> {
  heading('A2A agent card (unauthenticated)');
  for (const path of [`/${ENDPOINT}/.well-known/agent-card.json`, '/.well-known/agent-card.json']) {
    const response = await fetch(`${BASE}${path}`);
    const card = (await response.json()) as Record<string, unknown>;
    check(response.status === 200, `${path} -> 200`, response.status);
    const interfaces = card.supportedInterfaces as Array<Record<string, unknown>> | undefined;
    check(
      Array.isArray(interfaces) && interfaces.length > 0,
      `${path} declares supportedInterfaces`,
    );
    check(
      interfaces?.[0]?.tenant === ENDPOINT,
      `${path} declares tenant=${ENDPOINT}`,
      interfaces?.[0],
    );
    check(
      Boolean((card.securitySchemes as Record<string, unknown>)?.bearer),
      `${path} declares a bearer security scheme`,
    );
  }
}

async function testOverMatchingRoutes(token: string): Promise<void> {
  heading('routing: the escaped colon must not over-match');
  // '/:endpoint/message:stream' registered unescaped compiles to a param named `stream`
  // that also matches '/ep/messageANYTHING'. This is the regression guard.
  for (const path of [`/${ENDPOINT}/messageZZZ`, `/${ENDPOINT}/message`, `/${ENDPOINT}/tasks/x`]) {
    const response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: '{}',
    });
    await response.arrayBuffer();
    check(response.status === 404, `POST ${path} -> 404`, response.status);
  }
}

async function testA2AStream(token: string): Promise<void> {
  heading('A2A binding: message:stream');
  const contextId = `smoke-a2a-${crypto.randomUUID()}`;
  const requestId = crypto.randomUUID();

  const response = await fetch(`${BASE}/${ENDPOINT}/message:stream`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/a2a+json',
    },
    body: JSON.stringify({
      message: {
        messageId: crypto.randomUUID(),
        contextId,
        role: 'ROLE_USER',
        parts: [{ text: 'how much to SFO?' }],
      },
      configuration: { acceptedOutputModes: ['text/plain'] },
      metadata: { 'livekit.request_id': requestId },
    }),
  });

  check(response.status === 200, 'responds 200', response.status);
  if (!response.ok) {
    console.log(`  (body) ${JSON.stringify(await response.json())}`);
    return;
  }

  const frames: Array<Record<string, unknown>> = [];
  for await (const frame of sseFrames(response)) {
    const parsed = JSON.parse(frame) as Record<string, unknown>;
    frames.push(parsed);
    console.log(`    <- ${Object.keys(parsed).join(',')} ${JSON.stringify(parsed).slice(0, 160)}`);
  }

  // v1.0.1 s3.1.2: "the stream MUST begin with the Task object".
  check('task' in (frames[0] ?? {}), 'first frame opens a task', Object.keys(frames[0] ?? {}));
  check(
    !frames.some((frame) => 'message' in frame),
    'a task stream carries no bare Message frames (s3.1.2 makes the two shapes exclusive)',
  );
  check(
    frames.some((frame) => 'statusUpdate' in frame),
    'streams at least one statusUpdate',
  );

  // The greeting: first frame after the task opens, before any agent work.
  const greeting = frames[1] as
    | {
        statusUpdate?: {
          status?: { state?: string; message?: { parts?: Array<{ text?: string }> } };
        };
      }
    | undefined;
  check('statusUpdate' in (greeting ?? {}), 'the frame after the task is a statusUpdate');
  check(
    greeting?.statusUpdate?.status?.state === 'TASK_STATE_WORKING',
    'the greeting is TASK_STATE_WORKING',
    greeting?.statusUpdate?.status?.state,
  );
  check(
    greeting?.statusUpdate?.status?.message?.parts?.[0]?.text === 'Fetching data, please wait',
    'the greeting carries the waiting text',
    greeting?.statusUpdate?.status?.message?.parts,
  );
  const artifact = frames.find((frame) => 'artifactUpdate' in frame) as
    { artifactUpdate: { artifact: { name?: string }; lastChunk?: boolean } } | undefined;
  check(artifact !== undefined, 'emits an artifactUpdate');
  check(artifact?.artifactUpdate.artifact.name === 'answer', 'the artifact is named "answer"');
  check(artifact?.artifactUpdate.lastChunk === true, 'the artifact is marked lastChunk');

  const last = frames.at(-1) as { statusUpdate?: { status?: { state?: string } } } | undefined;
  check('statusUpdate' in (last ?? {}), 'the last frame is a statusUpdate');
  check(
    last?.statusUpdate?.status?.state === 'TASK_STATE_COMPLETED',
    'the terminal state is TASK_STATE_COMPLETED',
    last?.statusUpdate?.status?.state,
  );
  // v1.0.1 removed `final`; terminality is the state plus the close.
  check(!('final' in (last?.statusUpdate ?? {})), 'no `final` field (removed in A2A v1.0)');
}

async function testA2ABareMessage(token: string): Promise<void> {
  heading('A2A binding: the taskless Message shape');
  const response = await fetch(`${BASE}/${ENDPOINT}/message:stream?scenario=bare-message`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/a2a+json' },
    body: JSON.stringify({
      message: {
        messageId: crypto.randomUUID(),
        contextId: `smoke-bare-${crypto.randomUUID()}`,
        role: 'ROLE_USER',
        parts: [{ text: 'how much to SFO?' }],
      },
    }),
  });

  const frames: Array<Record<string, unknown>> = [];
  for await (const frame of sseFrames(response)) {
    frames.push(JSON.parse(frame) as Record<string, unknown>);
  }

  // s3.1.2: "If the agent returns a Message, the stream MUST contain exactly one Message
  // object and then close immediately."
  check(frames.length === 1, 'exactly one frame', frames.length);
  check('message' in (frames[0] ?? {}), 'and it is a Message', Object.keys(frames[0] ?? {}));
  const message = (frames[0] as { message?: { taskId?: string; role?: string } }).message;
  check(message?.role === 'ROLE_AGENT', 'the message is from the agent', message?.role);
  check(message?.taskId === undefined, 'it names no task, because none was opened');
}

async function testA2ASendAndCancel(token: string): Promise<void> {
  heading('A2A binding: message:send and tasks/{id}:cancel');
  const send = await fetch(`${BASE}/${ENDPOINT}/message:send`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/a2a+json' },
    body: JSON.stringify({
      message: {
        messageId: crypto.randomUUID(),
        contextId: `smoke-a2a-${crypto.randomUUID()}`,
        role: 'ROLE_USER',
        parts: [{ text: 'how much to SFO?' }],
      },
    }),
  });
  const task = (await send.json()) as {
    id?: string;
    status?: { state?: string };
    artifacts?: Array<{ name?: string }>;
  };
  check(send.status === 200, 'message:send -> 200', send.status);
  check(task.status?.state === 'TASK_STATE_COMPLETED', 'returns a completed Task', task.status);
  check(task.artifacts?.some((a) => a.name === 'answer') === true, 'the Task carries the answer');

  const cancelFinished = await fetch(
    `${BASE}/${ENDPOINT}/tasks/${encodeURIComponent(task.id ?? 'missing')}:cancel`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/a2a+json' },
      body: '{}',
    },
  );
  const cancelBody = (await cancelFinished.json()) as { details?: Array<{ reason?: string }> };
  check(
    cancelFinished.status === 400,
    'cancelling a finished task -> 400 TaskNotCancelable',
    cancelFinished.status,
  );
  check(
    cancelBody.details?.[0]?.reason === 'TASK_NOT_CANCELABLE',
    'the error carries reason TASK_NOT_CANCELABLE',
    cancelBody.details,
  );

  const missing = await fetch(`${BASE}/${ENDPOINT}/tasks/does-not-exist:cancel`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/a2a+json' },
    body: '{}',
  });
  await missing.arrayBuffer();
  check(missing.status === 404, 'cancelling an unknown task -> 404', missing.status);
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`smoke test against ${BASE}, endpoint "${ENDPOINT}"`);

  try {
    await fetch(`${BASE}/.well-known/agent-card.json`);
  } catch {
    console.error(`\ncannot reach ${BASE} -- is the server running? (pnpm dev)`);
    process.exit(1);
  }

  const token = await mintToken('mock-session', 'smoke-client');

  await testNativeHappyPath(token);
  await testDelegation(token);
  await testTypingScenario(token);
  await testConversationOrdering(token);
  await testDuplicateAndCancel(token);
  await testTerminalStates(token);
  await testAuth();
  await testAgentCard();
  await testOverMatchingRoutes(token);
  await testA2AStream(token);
  await testA2ABareMessage(token);
  await testA2ASendAndCancel(token);

  console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

await main();
