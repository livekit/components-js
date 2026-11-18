import { describe, test, expect, vi, afterEach } from 'vitest';

import {
  ThreadClient,
  ThreadClientError,
  publicApiUrlFromServerUrl,
  threadItemToReceivedChatMessage,
} from './ThreadClient';

type Call = { url: URL; init: RequestInit };

/** Stub global fetch with a queue of responses, recording each call. */
function mockFetch(...responses: Array<{ status?: number; body?: unknown }>) {
  const calls: Array<Call> = [];
  const fetchMock = vi.fn(async (input: URL | string, init: RequestInit = {}) => {
    calls.push({ url: new URL(input.toString()), init });
    const next = responses.shift() ?? {};
    const text = typeof next.body === 'string' ? next.body : JSON.stringify(next.body ?? {});
    return new Response(text, { status: next.status ?? 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('publicApiUrlFromServerUrl', () => {
  test('maps LiveKit Cloud project urls to the Cloud Public API', () => {
    expect(publicApiUrlFromServerUrl('wss://my-app-abc.staging.livekit.cloud')).toBe(
      'https://beta-api.staging.livekit.cloud',
    );
    expect(publicApiUrlFromServerUrl('https://my-app-abc.staging.livekit.cloud/')).toBe(
      'https://beta-api.staging.livekit.cloud',
    );
    expect(publicApiUrlFromServerUrl('wss://my-app-abc.livekit.cloud')).toBe(
      'https://beta-api.livekit.cloud',
    );
  });

  test('uses any other host as-is', () => {
    expect(publicApiUrlFromServerUrl('ws://localhost:7880')).toBe('http://localhost:7880');
    expect(publicApiUrlFromServerUrl('http://127.0.0.1:8080/')).toBe('http://127.0.0.1:8080');
    expect(publicApiUrlFromServerUrl('https://livekit.example.com')).toBe(
      'https://livekit.example.com',
    );
  });
});

describe('ThreadClient', () => {
  const serverUrl = 'wss://my-app.livekit.cloud';

  test('create posts to the project threads and sends the bearer token', async () => {
    const calls = mockFetch({ body: { thread: { threadId: 'AT_1', scope: 'user-1' } } });
    const client = new ThreadClient(serverUrl, 'tok');

    const thread = await client.create({
      scope: 'user-1',
      attributes: { title: 'Hi' },
      idleTtlSeconds: 3600,
    });

    expect(thread.threadId).toBe('AT_1');
    expect(calls[0].url.toString()).toBe('https://beta-api.livekit.cloud/v0/projects/p_/threads');
    expect(calls[0].init.method).toBe('POST');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      scope: 'user-1',
      attributes: { title: 'Hi' },
      idleTtl: '3600s',
    });
  });

  test('a token function is called for every request', async () => {
    mockFetch(
      { body: { thread: { threadId: 'AT_1' } } },
      { body: { thread: { threadId: 'AT_1' } } },
    );
    let n = 0;
    const client = new ThreadClient(serverUrl, async () => `tok-${++n}`);

    await client.get('AT_1');
    await client.get('AT_1');
    expect(n).toBe(2);
  });

  test('list sends scope + page params and returns the next cursor', async () => {
    const calls = mockFetch({
      body: { items: [{ threadId: 'AT_2' }], pageInfo: { nextCursor: 'c2', hasMore: true } },
    });
    const client = new ThreadClient(serverUrl, 'tok');

    const page = await client.list({ scope: 'user-1', pageToken: 'c1', limit: 5 });

    expect(page).toEqual({ results: [{ threadId: 'AT_2' }], nextPageToken: 'c2' });
    expect(calls[0].url.pathname).toBe('/v0/projects/p_/threads');
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      scope: 'user-1',
      'page.cursor': 'c1',
      'page.pageSize': '5',
    });
  });

  test('listAll follows the cursor until the last page', async () => {
    const calls = mockFetch(
      { body: { items: [{ threadId: 'AT_1' }], pageInfo: { nextCursor: 'c2' } } },
      { body: { items: [{ threadId: 'AT_2' }], pageInfo: { nextCursor: '' } } },
    );
    const client = new ThreadClient(serverUrl, 'tok');

    const ids: Array<string> = [];
    for await (const thread of client.listAll({ scope: 'user-1' })) {
      ids.push(thread.threadId);
    }

    expect(ids).toEqual(['AT_1', 'AT_2']);
    expect(calls[0].url.searchParams.has('page.cursor')).toBe(false);
    expect(calls[1].url.searchParams.get('page.cursor')).toBe('c2');
  });

  test('items maps sortOrder and agent onto the query', async () => {
    const calls = mockFetch({ body: { items: [] } });
    const client = new ThreadClient(serverUrl, 'tok');

    const page = await client.items('AT_1', { agent: 'dentist', sortOrder: 'desc' });

    expect(page).toEqual({ results: [], nextPageToken: null });
    expect(calls[0].url.pathname).toBe('/v0/projects/p_/threads/AT_1/items');
    expect(calls[0].url.searchParams.get('agent')).toBe('dentist');
    expect(calls[0].url.searchParams.get('sortOrder')).toBe('SORT_ORDER_DESC');
  });

  test('update patches, delete deletes, tasks filters by status', async () => {
    const calls = mockFetch(
      { body: { thread: { threadId: 'AT_1' } } },
      { body: {} },
      { body: { items: [{ taskId: 'T_1', status: 'RUNNING' }] } },
    );
    const client = new ThreadClient(serverUrl, 'tok');

    await client.update('AT_1', { attributes: { title: '' } });
    await client.delete('AT_1');
    const tasks = await client.tasks('AT_1', { status: 'RUNNING' });

    expect(calls[0].init.method).toBe('PATCH');
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ attributes: { title: '' } });
    expect(calls[1].init.method).toBe('DELETE');
    expect(calls[1].url.pathname).toBe('/v0/projects/p_/threads/AT_1');
    expect(calls[2].url.searchParams.get('status')).toBe('RUNNING');
    expect(tasks.results[0].taskId).toBe('T_1');
  });

  test('maps numeric gRPC error codes and falls back on the HTTP status', async () => {
    mockFetch(
      { status: 403, body: { code: 7, message: 'grant does not allow this', details: [] } },
      { status: 404, body: 'not here' },
    );
    const client = new ThreadClient(serverUrl, 'tok');

    const denied = await client.get('AT_1').catch((e) => e);
    expect(denied).toBeInstanceOf(ThreadClientError);
    expect(denied).toMatchObject({
      status: 403,
      code: 'permission_denied',
      message: 'grant does not allow this',
    });

    const missing = await client.get('AT_2').catch((e) => e);
    expect(missing).toMatchObject({ status: 404, code: 'not_found', message: 'not here' });
  });

  test('baseUrl overrides the derived Public API url', async () => {
    const calls = mockFetch({ body: { items: [] } });
    const client = new ThreadClient(serverUrl, 'tok', { baseUrl: 'http://localhost:8787/' });

    await client.list({ scope: 's' });
    expect(calls[0].url.origin).toBe('http://localhost:8787');
  });
});

describe('threadItemToReceivedChatMessage', () => {
  test('maps user / assistant text messages onto origin + role', () => {
    expect(
      threadItemToReceivedChatMessage({
        messageId: 'm1',
        seq: '3',
        item: {
          message: {
            id: 'item-1',
            role: 'ASSISTANT',
            content: [{ text: 'Hello ' }, { text: 'there' }],
            createdAt: '2026-11-19T10:00:00Z',
          },
        },
      }),
    ).toEqual({
      id: 'item-1',
      message: 'Hello there',
      timestamp: Date.parse('2026-11-19T10:00:00Z'),
      origin: 'agent',
      role: 'assistant',
    });

    expect(
      threadItemToReceivedChatMessage({
        messageId: 'm2',
        seq: 4,
        item: { message: { role: 'USER', content: [{ text: 'hi' }] } },
      }),
    ).toMatchObject({ id: 'm2-4', message: 'hi', origin: 'user', role: 'user' });
  });

  test('skips non-message items, system messages and empty text', () => {
    expect(threadItemToReceivedChatMessage({ item: { functionCall: { name: 'f' } } })).toBeNull();
    expect(
      threadItemToReceivedChatMessage({
        item: { message: { role: 'SYSTEM', content: [{ text: 'x' }] } },
      }),
    ).toBeNull();
    expect(
      threadItemToReceivedChatMessage({ item: { message: { role: 'USER', content: [] } } }),
    ).toBeNull();
  });
});
