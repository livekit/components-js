import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useToken } from './useToken';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const initial = { endpoint: '/token', room: 'first-room', identity: 'first-user' };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useToken', () => {
  test.each([
    { change: 'endpoint', next: { ...initial, endpoint: '/other-token' } },
    { change: 'room', next: { ...initial, room: 'second-room' } },
    { change: 'identity', next: { ...initial, identity: 'second-user' } },
  ])('ignores an older response after the $change changes', async ({ next }) => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
    );
    const { result, rerender } = renderHook(
      ({ endpoint, room, identity }) => useToken(endpoint, room, { userInfo: { identity } }),
      { initialProps: initial },
    );

    rerender(next);
    await act(async () => {
      second.resolve(Response.json({ accessToken: 'new-token' }));
    });
    expect(result.current).toBe('new-token');

    await act(async () => {
      first.resolve(Response.json({ accessToken: 'old-token' }));
    });
    expect(result.current).toBe('new-token');
  });

  test('ignores an obsolete response whose body finishes after the new request', async () => {
    const body = deferred<{ accessToken: string }>();
    const firstResponse = Response.json({});
    vi.spyOn(firstResponse, 'json').mockReturnValue(body.promise);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(Response.json({ accessToken: 'new-token' })),
    );
    const { result, rerender } = renderHook(
      ({ room }) => useToken('/token', room, { userInfo: { identity: 'user' } }),
      { initialProps: { room: 'first-room' } },
    );
    await act(async () => {});
    expect(firstResponse.json).toHaveBeenCalledOnce();

    rerender({ room: 'second-room' });
    await act(async () => {});
    expect(result.current).toBe('new-token');
    await act(async () => {
      body.resolve({ accessToken: 'old-token' });
    });
    expect(result.current).toBe('new-token');
  });
});
