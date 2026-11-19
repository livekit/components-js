import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useThread } from './useThread';
import { useThreadMessages } from './useThreadMessages';

/** A fixed token source (not a TokenSourceConfigurable), so useThread calls its fetch() directly. */
const tokenSource = {
  fetch: async () => ({ serverUrl: 'wss://my-app.livekit.cloud', participantToken: 'tok' }),
} as never;

/**
 * Stand in for the Public API's GetThreadItems over `count` text items (`m1` oldest … `mN` newest),
 * honouring sortOrder=desc paging. `gate`, when set, holds every response until it resolves.
 */
function mockItemsApi(count: number, options: { fail?: () => boolean; gate?: Promise<void> } = {}) {
  const requests: Array<URL> = [];
  const items = Array.from({ length: count }, (_, i) => ({
    seq: i + 1,
    item: {
      message: {
        id: `m${i + 1}`,
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: [{ text: `text ${i + 1}` }],
      },
    },
  }));

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | string) => {
      const url = new URL(input.toString());
      requests.push(url);
      await options.gate;
      if (options.fail?.()) {
        return new Response(JSON.stringify({ code: 14, message: 'unavailable' }), { status: 503 });
      }
      const pageSize = Number(url.searchParams.get('page.pageSize'));
      const cursor = url.searchParams.get('page.cursor');
      const end = cursor ? Number(cursor) : items.length;
      const start = Math.max(0, end - pageSize);
      return new Response(
        JSON.stringify({
          items: items.slice(start, end).reverse(),
          pageInfo: { nextCursor: start > 0 ? String(start) : '', hasMore: start > 0 },
        }),
        { status: 200 },
      );
    }),
  );
  return requests;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useThreadMessages history', () => {
  test('useThread alone never fetches history', async () => {
    const requests = mockItemsApi(4);
    const { result } = renderHook(() =>
      useThread(tokenSource, { threadId: 'AT_1', history: { pageSize: 2 } }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.internal.history.status).toBe('idle');
    expect(requests).toHaveLength(0);
  });

  test('the first consumer loads the latest page; concurrent consumers share the one request', async () => {
    const requests = mockItemsApi(4);
    const { result } = renderHook(() => {
      const thread = useThread(tokenSource, { threadId: 'AT_1', history: { pageSize: 2 } });
      return { a: useThreadMessages(thread), b: useThreadMessages(thread) };
    });

    expect(result.current.a.status).toBe('loading');
    await waitFor(() => expect(result.current.a.status).toBe('ready'));

    expect(requests).toHaveLength(1);
    expect(requests[0].pathname).toBe('/v0/projects/p_/threads/AT_1/items');
    expect(requests[0].searchParams.get('sortOrder')).toBe('SORT_ORDER_DESC');
    // The latest page, oldest first.
    expect(result.current.a.messages.map((m) => m.id)).toEqual(['m3', 'm4']);
    expect(result.current.b.messages).toBe(result.current.a.messages);
    expect(result.current.a.hasOlder).toBe(true);
    expect(result.current.a.error).toBeNull();
  });

  test('loadOlder pages back, prepending, until there is nothing older', async () => {
    mockItemsApi(5);
    const { result } = renderHook(() => {
      const thread = useThread(tokenSource, { threadId: 'AT_1', history: { pageSize: 2 } });
      return useThreadMessages(thread);
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    let loadOlder: Promise<void>;
    act(() => {
      loadOlder = result.current.loadOlder();
    });
    expect(result.current.status).toBe('loading-older');
    await act(() => loadOlder);
    expect(result.current.messages.map((m) => m.id)).toEqual(['m2', 'm3', 'm4', 'm5']);
    expect(result.current.hasOlder).toBe(true);

    await act(() => result.current.loadOlder());
    expect(result.current.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(result.current).toMatchObject({ status: 'ready', hasOlder: false });

    // Nothing older: a no-op.
    await act(() => result.current.loadOlder());
    expect(result.current.messages).toHaveLength(5);
  });

  test('history loads ahead of messages that arrived live while it was in flight', async () => {
    let release!: () => void;
    mockItemsApi(2, { gate: new Promise<void>((resolve) => (release = resolve)) });
    const { result } = renderHook(() => {
      const thread = useThread(tokenSource, { threadId: 'AT_1', history: { pageSize: 2 } });
      return { thread, messages: useThreadMessages(thread) };
    });

    act(() =>
      result.current.thread.internal.messageStore.upsertMessage({
        id: 'live',
        timestamp: Date.now(),
        message: 'arrived first',
        origin: 'user',
        role: 'user',
      }),
    );
    await act(async () => release());
    await waitFor(() => expect(result.current.messages.status).toBe('ready'));

    expect(result.current.messages.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'live']);
  });

  test("refresh re-fetches the loaded pages ('loaded') or resets to the latest page ('latest')", async () => {
    const requests = mockItemsApi(6);
    const { result } = renderHook(() => {
      const thread = useThread(tokenSource, { threadId: 'AT_1', history: { pageSize: 2 } });
      return useThreadMessages(thread);
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(() => result.current.loadOlder());
    expect(result.current.messages.map((m) => m.id)).toEqual(['m3', 'm4', 'm5', 'm6']);
    requests.length = 0;

    let refresh: Promise<void>;
    act(() => {
      refresh = result.current.refresh();
    });
    // The transcript stays on screen while refreshing.
    expect(result.current.status).toBe('refreshing');
    expect(result.current.messages).toHaveLength(4);
    await act(() => refresh);
    expect(requests).toHaveLength(2);
    expect(result.current.messages.map((m) => m.id)).toEqual(['m3', 'm4', 'm5', 'm6']);
    expect(result.current).toMatchObject({ status: 'ready', hasOlder: true });

    requests.length = 0;
    await act(() => result.current.refresh({ mode: 'latest' }));
    expect(requests).toHaveLength(1);
    expect(result.current.messages.map((m) => m.id)).toEqual(['m5', 'm6']);
    expect(result.current.hasOlder).toBe(true);
  });

  test('a failed request reports error, keeps the transcript, and refresh retries', async () => {
    let failing = true;
    mockItemsApi(2, { fail: () => failing });
    const { result } = renderHook(() => {
      const thread = useThread(tokenSource, { threadId: 'AT_1', history: { pageSize: 2 } });
      return useThreadMessages(thread);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('unavailable');
    expect(result.current.hasOlder).toBe(false);

    failing = false;
    await act(() => result.current.refresh());
    expect(result.current).toMatchObject({ status: 'ready', error: null });
    expect(result.current.messages.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  test('pageSize 0 disables history fetching', async () => {
    const requests = mockItemsApi(2);
    const { result } = renderHook(() => {
      const thread = useThread(tokenSource, { threadId: 'AT_1', history: { pageSize: 0 } });
      return useThreadMessages(thread);
    });

    await act(async () => {});
    expect(result.current).toMatchObject({ status: 'disabled', hasOlder: false, error: null });
    await act(() => result.current.refresh());
    expect(requests).toHaveLength(0);
  });

  test('a thread created by the first send is marked loaded without fetching', async () => {
    const requests = mockItemsApi(2);
    const { result } = renderHook(() => {
      const thread = useThread(tokenSource, { history: { pageSize: 2 } });
      return { thread, messages: useThreadMessages(thread) };
    });

    // No thread id yet: nothing to fetch.
    await act(async () => {});
    expect(result.current.messages.status).toBe('idle');

    // The transport reports the thread it created on the first send.
    act(() => {
      result.current.thread.textTransport.emit('threadStarted', 'AT_new');
    });
    await waitFor(() => expect(result.current.thread.threadId).toBe('AT_new'));
    expect(result.current.messages).toMatchObject({ status: 'ready', hasOlder: false });
    expect(requests).toHaveLength(0);
  });

  test('switching to another thread drops the transcript and loads the new thread', async () => {
    const requests = mockItemsApi(2);
    const { result, rerender } = renderHook(
      ({ threadId }) => {
        const thread = useThread(tokenSource, { threadId, history: { pageSize: 2 } });
        return useThreadMessages(thread);
      },
      { initialProps: { threadId: 'AT_1' } },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    rerender({ threadId: 'AT_2' });
    await waitFor(() => expect(requests).toHaveLength(2));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(requests[1].pathname).toBe('/v0/projects/p_/threads/AT_2/items');
    expect(result.current.messages.map((m) => m.id)).toEqual(['m1', 'm2']);
  });
});
