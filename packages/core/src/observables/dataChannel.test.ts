import { Room } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupDataMessageHandler } from './dataChannel';

describe('data channel sending state', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends without subscribing to the sending-state observable', async () => {
    const room = new Room();
    const publish = vi.spyOn(room.localParticipant, 'publishData').mockResolvedValue();
    const { send } = setupDataMessageHandler(room, 'chat');
    const payload = new Uint8Array([1, 2, 3]);

    await expect(send(payload, { reliable: true })).resolves.toBeUndefined();
    expect(publish).toHaveBeenCalledExactlyOnceWith(payload, {
      topic: 'chat',
      reliable: true,
      destinationIdentities: undefined,
    });
  });

  it('shares current state with multiple subscribers, including one joining during a send', async () => {
    const room = new Room();
    let finish = () => {};
    vi.spyOn(room.localParticipant, 'publishData').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { send, isSendingObservable } = setupDataMessageHandler(room);
    const first: boolean[] = [];
    const second: boolean[] = [];
    const late: boolean[] = [];
    const firstSubscription = isSendingObservable.subscribe((value) => first.push(value));
    const secondSubscription = isSendingObservable.subscribe((value) => second.push(value));
    const sending = send(new Uint8Array([1]));
    const lateSubscription = isSendingObservable.subscribe((value) => late.push(value));

    try {
      expect(first).toEqual([false, true]);
      expect(second).toEqual([false, true]);
      expect(late).toEqual([true]);
      secondSubscription.unsubscribe();
      finish();
      await sending;
      expect(first).toEqual([false, true, false]);
      expect(second).toEqual([false, true]);
      expect(late).toEqual([true, false]);
    } finally {
      finish();
      await sending;
      firstSubscription.unsubscribe();
      secondSubscription.unsubscribe();
      lateSubscription.unsubscribe();
    }
  });

  it('resets state after a publish failure and preserves the original error', async () => {
    const room = new Room();
    const error = new Error('publish failed');
    vi.spyOn(room.localParticipant, 'publishData').mockRejectedValue(error);
    const { send, isSendingObservable } = setupDataMessageHandler(room);
    const states: boolean[] = [];
    const subscription = isSendingObservable.subscribe((value) => states.push(value));

    try {
      await expect(send(new Uint8Array([1]))).rejects.toBe(error);
      expect(states).toEqual([false, true, false]);
    } finally {
      subscription.unsubscribe();
    }
  });
});
