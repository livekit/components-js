/**
 * Smoke suite, and the reference for how a client drives this protocol.
 *
 *   pnpm smoke
 *
 * Exits non-zero if anything fails. EventSource cannot be used: it is GET-only and
 * message:stream is a POST, so the stream is read with fetch plus the frame parser below.
 */

import { EXTENSION_URI } from '../src/extension.ts';
import { mintToken } from './token.ts';

const BASE = process.env.MOCK_BASE_URL ?? `http://localhost:${process.env.PORT ?? '8787'}`;
const ENDPOINT = (process.env.MOCK_ENDPOINTS ?? 'fare-desk').split(',')[0].trim();
const V1 = `${BASE}/${ENDPOINT}/v1`;

const key = (name: string): string => `${EXTENSION_URI}/${name}`;
const KIND = key('kind');
const VERBATIM = key('verbatim');
const DIRECTIVE = key('directive');
const REASON = key('reason');

let failures = 0;
let token = '';

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
// wire helpers
// ---------------------------------------------------------------------------

type Frame = Record<string, any>;

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

type SendOptions = {
  contextId?: string;
  text?: string;
  activate?: boolean;
  kind?: 'delegation' | 'close';
  chatCtx?: unknown[];
  referenceTaskIds?: string[];
  metadata?: Record<string, unknown>;
  scenario?: string;
  onOpen?: (taskId: string) => void | Promise<void>;
};

function buildBody(options: SendOptions): unknown {
  const parts: unknown[] = [{ text: options.text ?? '' }];
  if (options.chatCtx) {
    parts.push({ data: { items: options.chatCtx }, metadata: { [KIND]: 'chat_ctx' } });
  }
  const message: Record<string, unknown> = {
    messageId: crypto.randomUUID(),
    role: 'ROLE_USER',
    parts,
  };
  if (options.contextId) message.contextId = options.contextId;
  if (options.kind) message.metadata = { [KIND]: options.kind };
  if (options.referenceTaskIds) message.referenceTaskIds = options.referenceTaskIds;
  return {
    message,
    configuration: { acceptedOutputModes: ['text/plain'] },
    metadata: options.metadata ?? {},
  };
}

function headers(activate: boolean): Record<string, string> {
  const base: Record<string, string> = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/a2a+json',
    'A2A-Version': '1.0',
  };
  if (activate) base['A2A-Extensions'] = EXTENSION_URI;
  return base;
}

type StreamResult = { status: number; echoed: string | null; frames: Frame[]; taskId: string };

async function stream(options: SendOptions): Promise<StreamResult> {
  const url = new URL(`${V1}/message:stream`);
  if (options.scenario) url.searchParams.set('scenario', options.scenario);

  const response = await fetch(url, {
    method: 'POST',
    headers: headers(options.activate ?? true),
    body: JSON.stringify(buildBody(options)),
  });

  const result: StreamResult = {
    status: response.status,
    echoed: response.headers.get('a2a-extensions'),
    frames: [],
    taskId: '',
  };
  if (!response.ok) {
    console.log(`  (body) ${JSON.stringify(await response.json())}`);
    return result;
  }

  for await (const raw of sseFrames(response)) {
    const frame = JSON.parse(raw) as Frame;
    result.frames.push(frame);
    if (frame.task) {
      result.taskId = frame.task.id;
      if (options.onOpen) await options.onOpen(frame.task.id);
    }
  }
  return result;
}

const statuses = (frames: Frame[]): Frame[] =>
  frames.filter((f) => f.statusUpdate).map((f) => f.statusUpdate);
const working = (frames: Frame[]): Frame[] =>
  statuses(frames).filter((s) => s.status.state === 'TASK_STATE_WORKING');
const terminal = (frames: Frame[]): Frame | undefined => {
  const all = statuses(frames);
  const last = all.at(-1);
  return last && last.status.state !== 'TASK_STATE_WORKING' ? last : undefined;
};
const artifacts = (frames: Frame[]): Frame[] =>
  frames.filter((f) => f.artifactUpdate).map((f) => f.artifactUpdate);
const partsOf = (status: Frame): any[] => status.status.message?.parts ?? [];
const textIn = (status: Frame): string =>
  partsOf(status)
    .filter((p: any) => typeof p.text === 'string')
    .map((p: any) => p.text)
    .join('');
const itemIn = (status: Frame): any =>
  partsOf(status).find((p: any) => p.metadata?.[KIND] === 'chat_item')?.data;

function describeFrames(frames: Frame[], indent = '    '): void {
  for (const frame of frames) {
    if (frame.task) {
      console.log(`${indent}<- task           ${frame.task.status.state}`);
    } else if (frame.statusUpdate) {
      const item = itemIn(frame.statusUpdate);
      const verbatim = frame.statusUpdate.status.message?.metadata?.[VERBATIM] ? ' [verbatim]' : '';
      const directive = frame.statusUpdate.metadata?.[DIRECTIVE]
        ? ` [directive ${frame.statusUpdate.metadata[DIRECTIVE].kind}]`
        : '';
      console.log(
        `${indent}<- statusUpdate   ${frame.statusUpdate.status.state}${verbatim}${directive} ` +
          `item=${item ? item.type : '-'} text=${JSON.stringify(textIn(frame.statusUpdate).slice(0, 48))}`,
      );
    } else if (frame.artifactUpdate) {
      const a = frame.artifactUpdate;
      console.log(
        `${indent}<- artifactUpdate ${a.artifact.name} append=${a.append} lastChunk=${a.lastChunk} ` +
          `${a.artifact.metadata?.[VERBATIM] ? '[verbatim] ' : ''}${JSON.stringify(a.artifact.parts[0]?.text?.slice(0, 40))}`,
      );
    } else {
      console.log(`${indent}<- ${Object.keys(frame).join(',')}`);
    }
  }
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

async function testAgentCard(): Promise<void> {
  heading('agent card (unauthenticated)');
  const response = await fetch(`${BASE}/${ENDPOINT}/.well-known/agent-card.json`);
  const card = (await response.json()) as any;
  check(response.status === 200, 'card -> 200', response.status);
  check(card.name === ENDPOINT, 'name is the endpoint name', card.name);
  check(card.skills?.length === 1, 'exactly one skill', card.skills?.length);
  check(card.skills?.[0]?.id === 'delegate', 'the skill is `delegate`', card.skills?.[0]);
  check(
    card.capabilities?.extensions?.some((e: any) => e.uri === EXTENSION_URI),
    'capabilities.extensions declares the extension URI',
  );
  check(
    card.capabilities?.extensions?.[0]?.required === false,
    'the extension is not required',
    card.capabilities?.extensions?.[0],
  );
  check(
    card.supportedInterfaces?.[0]?.url === `${BASE}/${ENDPOINT}/v1`,
    'the interface url is the endpoint prefix plus /v1',
    card.supportedInterfaces?.[0]?.url,
  );
  check(card.capabilities?.streaming === true, 'streaming is advertised');

  const rooted = await fetch(`${BASE}/.well-known/agent-card.json`);
  await rooted.json();
  check(rooted.status === 200, 'the host-rooted card also resolves', rooted.status);
}

async function testActivatedRun(): Promise<void> {
  heading('activated: a full turn');
  const run = await stream({ contextId: `c-${crypto.randomUUID()}`, text: 'how much to SFO?' });
  describeFrames(run.frames);

  check(run.status === 200, 'responds 200', run.status);
  check(run.echoed === EXTENSION_URI, 'the server echoes A2A-Extensions', run.echoed);
  check(
    Boolean(run.frames[0]?.task),
    'the first frame is the Task',
    Object.keys(run.frames[0] ?? {}),
  );
  check(Boolean(run.taskId), 'the Task carries a server-minted id');

  const term = terminal(run.frames);
  check(run.frames.at(-1)?.statusUpdate !== undefined, 'the last frame is a status event');
  check(
    term?.status.state === 'TASK_STATE_COMPLETED',
    'terminal state COMPLETED',
    term?.status.state,
  );

  const art = artifacts(run.frames);
  check(art.length === 1, 'exactly one answer artifact', art.length);
  check(art[0]?.artifact.name === 'answer', 'the artifact is named answer');
  check(art[0]?.lastChunk === true, 'the artifact is marked lastChunk');

  // Order: task, then WORKING statuses, then the artifact, then the terminal status.
  const kinds = run.frames.map((f) => (f.task ? 'task' : f.artifactUpdate ? 'artifact' : 'status'));
  check(kinds[0] === 'task', 'order: task first');
  check(kinds.at(-1) === 'status', 'order: terminal status last');
  check(kinds.at(-2) === 'artifact', 'order: the artifact precedes the terminal status', kinds);
  check(
    kinds.slice(1, -2).every((k) => k === 'status'),
    'order: only WORKING statuses in between',
    kinds,
  );

  // Every WORKING status carries the chat item that produced it.
  const work = working(run.frames);
  check(work.length > 0, 'streams WORKING statuses', work.length);
  check(
    work.every((s) => itemIn(s) !== undefined),
    'every WORKING status carries a chat_item part',
  );
  check(
    work.every(
      (s) => typeof itemIn(s)?.id === 'string' && typeof itemIn(s)?.created_at === 'number',
    ),
    'each chat item has an id and a numeric created_at (Unix seconds)',
    work.map((s) => itemIn(s)?.created_at),
  );
  check(
    work.some((s) => itemIn(s)?.type === 'function_call' && itemIn(s)?.update_of),
    'a progress report sets update_of',
  );
  check(
    work.some((s) => itemIn(s)?.type === 'function_call' && !itemIn(s)?.update_of),
    'a plain tool call is present too',
  );
  check(
    work
      .filter(
        (s) => itemIn(s)?.type === 'function_call' || itemIn(s)?.type === 'function_call_output',
      )
      .every((s) => textIn(s) === '' || itemIn(s)?.update_of),
    'tool calls and results carry no relayed text',
  );

  // The say() greeting.
  const say = work.find((s) => s.status.message?.metadata?.[VERBATIM]);
  check(Boolean(say), 'the say() message is marked lk/verbatim');
  check(textIn(say ?? ({} as Frame)).length > 0, 'the verbatim message carries its text');

  // The terminal status carries the answer's chat item as a data part.
  check(
    itemIn(term ?? ({} as Frame))?.type === 'message',
    'the terminal status carries the answer item',
  );
}

async function testPlainA2A(): Promise<void> {
  heading('unactivated: the same task as plain A2A');
  const run = await stream({
    contextId: `c-${crypto.randomUUID()}`,
    text: 'how much to SFO?',
    activate: false,
  });
  describeFrames(run.frames);

  check(run.status === 200, 'responds 200', run.status);
  check(run.echoed === null, 'no A2A-Extensions echo', run.echoed);

  const serialized = JSON.stringify(run.frames);
  check(!serialized.includes(EXTENSION_URI), 'no lk/ keys anywhere in the stream');
  check(
    !run.frames.some((f) => JSON.stringify(f).includes('"data"')),
    'no data parts anywhere in the stream',
  );
  check(Boolean(run.frames[0]?.task), 'still opens a Task');
  check(artifacts(run.frames).length === 1, 'still gets the answer artifact');
  check(terminal(run.frames)?.status.state === 'TASK_STATE_COMPLETED', 'still reaches COMPLETED');
  check(
    working(run.frames).every((s) => textIn(s).length > 0),
    'every WORKING status a plain client sees carries text',
  );
}

async function testProgressTextRule(): Promise<void> {
  heading("s3.4: a progress report's shape depends on the caller");
  const contextId = `c-${crypto.randomUUID()}`;

  const person = await stream({ contextId, text: 'how much to SFO?' });
  const asDelegation = await stream({
    contextId: `c-${crypto.randomUUID()}`,
    text: 'check the Monday change fee',
    kind: 'delegation',
    chatCtx: [],
  });

  const reportOf = (frames: Frame[]): Frame | undefined =>
    working(frames).find((s) => itemIn(s)?.type === 'function_call' && itemIn(s)?.update_of);

  const personReport = reportOf(person.frames);
  const delegationReport = reportOf(asDelegation.frames);

  check(
    Boolean(personReport) && Boolean(delegationReport),
    'both callers produce a progress report',
  );
  check(
    textIn(delegationReport ?? ({} as Frame)).length > 0,
    "delegation: the report's own words are the relayed text",
    textIn(delegationReport ?? ({} as Frame)),
  );
  check(
    textIn(personReport ?? ({} as Frame)) === '',
    "person's message: the report itself carries no text",
    textIn(personReport ?? ({} as Frame)),
  );

  // For a person's message the model phrases the report as an ordinary message, so the
  // same scenario yields one more item than the delegation does.
  const items = (frames: Frame[]): string[] => working(frames).map((s) => itemIn(s)?.type);
  check(
    items(person.frames).length === items(asDelegation.frames).length + 1,
    "person's message produces one extra item (the phrased message)",
    [items(person.frames), items(asDelegation.frames)],
  );
}

async function testDelegationChatCtx(): Promise<void> {
  heading('delegation: chat_ctx, deduplicated by item id');
  const contextId = `c-${crypto.randomUUID()}`;
  const asked = 'my flight to Tokyo is delayed, what are my options?';
  const chatCtx = [
    { id: 'item_9a', type: 'message', role: 'user', content: [asked], created_at: 1789012345.1 },
    {
      id: 'item_9b',
      type: 'message',
      role: 'assistant',
      content: ['Sorry to hear that, let me look.'],
      created_at: 1789012347.8,
    },
  ];

  // An empty text part: "the expert answers the last user message in the conversation
  // part". The scenario comes from the query string precisely so the text can stay empty.
  const first = await stream({
    contextId,
    text: '',
    scenario: 'plain',
    kind: 'delegation',
    chatCtx,
  });
  const answer = artifacts(first.frames)[0]?.artifact.parts[0]?.text ?? '';
  check(first.status === 200, 'responds 200', first.status);
  check(answer.includes(asked), 'an empty instruction answers the last user message', answer);

  // Re-send the whole conversation plus one new item. Only the new one is adopted.
  const grown = [
    ...chatCtx,
    {
      id: 'item_9c',
      type: 'message',
      role: 'user',
      content: ['any refund?'],
      created_at: 1789012400.0,
    },
  ];
  const second = await stream({
    contextId,
    text: 'and a refund?',
    kind: 'delegation',
    chatCtx: grown,
  });
  check(second.status === 200, 're-sending the whole conversation succeeds', second.status);

  const task = await fetch(`${V1}/tasks/${second.taskId}`, { headers: headers(true) });
  check(task.status === 200, 'GET /v1/tasks/{id} returns the task', task.status);
  const fetched = (await task.json()) as any;
  check(fetched.id === second.taskId, 'and it is the right task');
  check(
    fetched.status?.state === 'TASK_STATE_COMPLETED',
    'with its terminal state',
    fetched.status,
  );
}

async function testVerbatimAndDirective(): Promise<void> {
  heading('lk/verbatim and lk/directive');
  const verbatim = await stream({ contextId: `c-${crypto.randomUUID()}`, text: '/say' });
  const art = artifacts(verbatim.frames)[0];
  check(art?.artifact.metadata?.[VERBATIM] === true, 'the answer artifact carries lk/verbatim');

  const ended = await stream({ contextId: `c-${crypto.randomUUID()}`, text: '/end' });
  describeFrames(ended.frames.slice(-2));
  const term = terminal(ended.frames);
  check(
    term?.status.state === 'TASK_STATE_COMPLETED',
    'directive run completes',
    term?.status.state,
  );
  check(
    term?.metadata?.[DIRECTIVE]?.kind === 'end_session',
    'lk/directive rides the EVENT metadata',
    term?.metadata,
  );
  check(term?.metadata?.[DIRECTIVE]?.reason === 'caller_done', 'the directive carries a reason');
  check(
    working(ended.frames).every((s) => s.metadata?.[DIRECTIVE] === undefined),
    'no directive on any WORKING status',
  );

  const escalate = await stream({ contextId: `c-${crypto.randomUUID()}`, text: '/escalate' });
  check(
    terminal(escalate.frames)?.metadata?.[DIRECTIVE]?.kind === 'escalate',
    'the escalate directive is carried too',
  );

  // A plain client must not see it.
  const plain = await stream({
    contextId: `c-${crypto.randomUUID()}`,
    text: '/end',
    activate: false,
  });
  check(
    terminal(plain.frames)?.metadata === undefined,
    'unactivated, no directive is sent at all',
    terminal(plain.frames)?.metadata,
  );
}

async function testTerminalStates(): Promise<void> {
  heading('terminal states');
  const failed = await stream({ contextId: `c-${crypto.randomUUID()}`, text: '/fail' });
  const failTerm = terminal(failed.frames);
  check(failTerm?.status.state === 'TASK_STATE_FAILED', '/fail -> FAILED', failTerm?.status.state);
  check(artifacts(failed.frames).length === 0, 'FAILED carries NO answer artifact');
  check(textIn(failTerm ?? ({} as Frame)).length > 0, 'FAILED carries the reason as a text part');

  const ask = await stream({ contextId: `c-${crypto.randomUUID()}`, text: '/ask' });
  const askTerm = terminal(ask.frames);
  check(
    askTerm?.status.state === 'TASK_STATE_INPUT_REQUIRED',
    '/ask -> INPUT_REQUIRED',
    askTerm?.status.state,
  );
  check(artifacts(ask.frames).length === 1, 'INPUT_REQUIRED DOES carry an answer artifact');
  check(
    artifacts(ask.frames)[0]?.artifact.parts[0]?.text?.includes('?'),
    'and the answer is the question',
  );

  // The reply is a new task carrying referenceTaskIds. Nothing resumes.
  const reply = await stream({
    contextId: `c-${crypto.randomUUID()}`,
    text: 'from SFO',
    referenceTaskIds: [ask.taskId],
  });
  check(reply.status === 200, 'the reply arrives as a new task', reply.status);
  check(reply.taskId !== ask.taskId, 'with a new task id');
}

async function testChunkedAnswer(): Promise<void> {
  heading('chunked answer artifact');
  const run = await stream({ contextId: `c-${crypto.randomUUID()}`, text: '/chunks' });
  const art = artifacts(run.frames);
  describeFrames(run.frames.filter((f) => f.artifactUpdate));
  check(art.length > 1, 'the answer arrives in several chunks', art.length);
  check(art[0]?.append === false, 'the first chunk does not append');
  check(
    art.slice(1).every((a) => a.append === true),
    'later chunks append',
  );
  check(art.at(-1)?.lastChunk === true, 'only the last sets lastChunk');
  check(
    art.slice(0, -1).every((a) => a.lastChunk === false),
    'earlier chunks do not',
  );
  check(
    new Set(art.map((a) => a.artifact.artifactId)).size === 1,
    'all chunks share one artifactId',
  );
}

async function testCancel(): Promise<void> {
  heading('cancel, with lk/reason');
  const contextId = `c-${crypto.randomUUID()}`;
  let cancelStatus = 0;
  let cancelBody: any;

  const run = await stream({
    contextId,
    text: '/slow price SFO',
    onOpen: async (taskId) => {
      const response = await fetch(`${V1}/tasks/${taskId}:cancel`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ [REASON]: 'the user interrupted' }),
      });
      cancelStatus = response.status;
      cancelBody = await response.json();
    },
  });

  check(cancelStatus === 200, 'CancelTask -> 200', cancelStatus);
  check(
    cancelBody?.status?.state === 'TASK_STATE_CANCELED',
    'it responds with the Task',
    cancelBody?.status,
  );

  const term = terminal(run.frames);
  check(
    term?.status.state === 'TASK_STATE_CANCELED',
    'the stream ends CANCELED',
    term?.status.state,
  );
  check(artifacts(run.frames).length === 0, 'CANCELED carries no answer artifact');
  check(textIn(term ?? ({} as Frame)).length > 0, 'and reports what landed as text');

  const again = await fetch(`${V1}/tasks/${run.taskId}:cancel`, {
    method: 'POST',
    headers: headers(true),
    body: '{}',
  });
  const body = (await again.json()) as any;
  check(again.status === 400, 'cancelling a finished task -> 400', again.status);
  check(
    body?.details?.[0]?.reason === 'TASK_NOT_CANCELABLE',
    'with TASK_NOT_CANCELABLE',
    body?.details,
  );

  const missing = await fetch(`${V1}/tasks/nope:cancel`, {
    method: 'POST',
    headers: headers(true),
    body: '{}',
  });
  await missing.json();
  check(missing.status === 404, 'cancelling an unknown task -> 404', missing.status);
}

async function testClose(): Promise<void> {
  heading('close: the conversation is over');
  const contextId = `c-${crypto.randomUUID()}`;
  await stream({ contextId, text: 'hello there' });

  const closed = await stream({ contextId, kind: 'close' });
  describeFrames(closed.frames);
  const term = terminal(closed.frames);
  check(closed.status === 200, 'close -> 200', closed.status);
  check(Boolean(closed.frames[0]?.task), 'it still opens a Task');
  check(term?.status.state === 'TASK_STATE_COMPLETED', 'and completes', term?.status.state);
  check(artifacts(closed.frames).length === 0, 'with NO answer artifact');
  check(working(closed.frames).length === 0, 'and no WORKING statuses');

  // The conversation is forgotten, so the same context id starts fresh.
  const after = await stream({
    contextId,
    text: '',
    scenario: 'plain',
    kind: 'delegation',
    chatCtx: [],
  });
  const answer = artifacts(after.frames)[0]?.artifact.parts[0]?.text ?? '';
  check(after.status === 200, 'a later message on that context still works', after.status);
  check(!answer.includes('hello there'), 'and the dropped conversation is gone', answer);
}

async function testQueueing(): Promise<void> {
  heading('s3.5: a second message queues, it does not cancel');
  const contextId = `c-${crypto.randomUUID()}`;
  const order: string[] = [];

  const first = stream({
    contextId,
    text: '/plain first',
    onOpen: () => void order.push('task-1'),
  }).then((r) => {
    order.push('done-1');
    return r;
  });
  // Send the second as soon as the first has been acknowledged.
  await new Promise((resolve) => setTimeout(resolve, 60));
  const second = stream({
    contextId,
    text: '/plain second',
    onOpen: () => void order.push('task-2'),
  }).then((r) => {
    order.push('done-2');
    return r;
  });

  const [a, b] = await Promise.all([first, second]);
  check(a.status === 200 && b.status === 200, 'both tasks succeed');
  check(
    terminal(a.frames)?.status.state === 'TASK_STATE_COMPLETED' &&
      terminal(b.frames)?.status.state === 'TASK_STATE_COMPLETED',
    'neither is cancelled by the other',
  );
  check(
    order.indexOf('task-2') < order.indexOf('done-1'),
    'the second Task event arrives while the first is still running',
    order,
  );
  check(order.indexOf('done-1') < order.indexOf('done-2'), 'but its work runs after', order);
  check(a.taskId !== b.taskId, 'they are distinct tasks');
}

async function testAuthAndRouting(): Promise<void> {
  heading('auth and routing');
  const noToken = await fetch(`${V1}/message:stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/a2a+json' },
    body: JSON.stringify(buildBody({ text: 'hi' })),
  });
  await noToken.arrayBuffer();
  check(noToken.status === 401, 'no token -> 401', noToken.status);

  const bad = await fetch(`${V1}/message:stream`, {
    method: 'POST',
    headers: { authorization: 'Bearer not.a.jwt', 'content-type': 'application/a2a+json' },
    body: JSON.stringify(buildBody({ text: 'hi' })),
  });
  await bad.arrayBuffer();
  check(bad.status === 401, 'malformed token -> 401', bad.status);

  // The pre-/v1 paths are gone: a stale client must fail loudly.
  for (const path of [`/${ENDPOINT}/message:stream`, `/${ENDPOINT}/message:send`]) {
    const response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: headers(true),
      body: '{}',
    });
    await response.arrayBuffer();
    check(response.status === 404, `the pre-/v1 path ${path} -> 404`, response.status);
  }

  // The escaped-colon guard, which had to survive the route move.
  for (const path of [`${V1}/messageZZZ`, `${V1}/message`, `${V1}/tasks`]) {
    const response = await fetch(path, { method: 'POST', headers: headers(true), body: '{}' });
    await response.arrayBuffer();
    check(response.status === 404, `POST ${path.replace(BASE, '')} -> 404`, response.status);
  }
}

async function testMessageSend(): Promise<void> {
  heading('message:send (non-streaming)');
  const response = await fetch(`${V1}/message:send`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify(
      buildBody({ contextId: `c-${crypto.randomUUID()}`, text: 'how much to SFO?' }),
    ),
  });
  const task = (await response.json()) as any;
  check(response.status === 200, 'responds 200', response.status);
  check(task.status?.state === 'TASK_STATE_COMPLETED', 'a completed Task', task.status);
  check(
    task.artifacts?.some((a: any) => a.name === 'answer'),
    'carrying the answer artifact',
  );
  check(Array.isArray(task.history) && task.history.length > 0, 'and its history');
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`smoke test against ${BASE}, endpoint "${ENDPOINT}"`);
  console.log(`extension ${EXTENSION_URI}`);

  try {
    await fetch(`${BASE}/.well-known/agent-card.json`);
  } catch {
    console.error(`\ncannot reach ${BASE} -- is the server running? (pnpm dev)`);
    process.exit(1);
  }

  token = await mintToken('mock-session', 'smoke-client');

  await testAgentCard();
  await testActivatedRun();
  await testPlainA2A();
  await testProgressTextRule();
  await testDelegationChatCtx();
  await testVerbatimAndDirective();
  await testTerminalStates();
  await testChunkedAnswer();
  await testCancel();
  await testClose();
  await testQueueing();
  await testAuthAndRouting();
  await testMessageSend();

  console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

await main();
