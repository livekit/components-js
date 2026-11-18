import { describe, test, expect, vi, afterEach } from 'vitest';

import { TextTransport } from './TextTransport';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stub global fetch with one JSON response, recording the requested urls. */
function mockFetch(body: unknown) {
  const urls: Array<URL> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | string) => {
      urls.push(new URL(input.toString()));
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
  return urls;
}

const credentials = async () => ({
  serverUrl: 'wss://my-app.livekit.cloud',
  participantToken: 'tok',
});

describe('TextTransport.loadThreadMessagesPage', () => {
  test('returns an empty page without a request when there is no thread yet', async () => {
    const urls = mockFetch({});
    const transport = new TextTransport({ getCredentials: credentials });

    expect(await transport.loadThreadMessagesPage({ pageSize: 10 })).toEqual({
      messages: [],
      olderCursor: null,
    });
    expect(urls).toHaveLength(0);
  });

  test('reads the latest items page newest-first and returns it oldest-first', async () => {
    const urls = mockFetch({
      // Newest first, as sortOrder=desc returns them.
      items: [
        { item: { message: { id: 'b', role: 'ASSISTANT', content: [{ text: 'hello' }] } } },
        { item: { functionCall: { id: 'call', callId: 'c', name: 'lookup', arguments: '{}' } } },
        { item: { message: { id: 'a', role: 'USER', content: [{ text: 'hi' }] } } },
      ],
      pageInfo: { nextCursor: 'older', hasMore: true },
    });
    const transport = new TextTransport({ getCredentials: credentials, threadId: 'AT_1' });

    const page = await transport.loadThreadMessagesPage({ pageSize: 3, agent: 'dentist' });

    expect(page.messages.map((m) => m.id)).toEqual(['a', 'call', 'b']);
    expect(page.olderCursor).toBe('older');
    expect(urls[0].origin).toBe('https://beta-api.livekit.cloud');
    expect(urls[0].pathname).toBe('/v0/projects/p_/threads/AT_1/items');
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      sortOrder: 'SORT_ORDER_DESC',
      'page.pageSize': '3',
      agent: 'dentist',
    });
  });

  test('passes the cursor through and honours a publicApiUrl override', async () => {
    const urls = mockFetch({ items: [], pageInfo: { nextCursor: '' } });
    const transport = new TextTransport({
      getCredentials: credentials,
      threadId: 'AT_1',
      publicApiUrl: 'http://localhost:8787',
    });

    const page = await transport.loadThreadMessagesPage({ pageSize: 5, cursor: 'older' });

    expect(page).toEqual({ messages: [], olderCursor: null });
    expect(urls[0].origin).toBe('http://localhost:8787');
    expect(urls[0].searchParams.get('page.cursor')).toBe('older');
  });
});
