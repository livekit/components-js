import { DataPacket_Kind } from '@livekit/protocol';
import { act, cleanup, renderHook } from '@testing-library/react';
import { Room, RoomEvent } from 'livekit-client';
import { afterEach, describe, expect, it } from 'vitest';
import { useChat } from './useChat';

describe('useChat options', () => {
  const rooms: Room[] = [];

  afterEach(() => {
    cleanup();
    rooms.forEach((room) => room.emit(RoomEvent.Disconnected));
    rooms.length = 0;
  });

  it.each([undefined, 'custom-chat'])(
    'retains messages with inline options for %s',
    (channelTopic) => {
      const room = new Room();
      rooms.push(room);
      let renders = 0;
      const { result, rerender } = renderHook(() => {
        // Bound a regression's render loop so the test fails instead of hanging.
        if (++renders > 20) throw new Error('useChat did not settle with inline options');
        return useChat({ room, channelTopic });
      });

      act(() => {
        room.emit(
          RoomEvent.DataReceived,
          new TextEncoder().encode(
            JSON.stringify({ id: 'message-1', timestamp: 1, message: 'hello' }),
          ),
          undefined,
          DataPacket_Kind.RELIABLE,
          channelTopic ?? 'lk-chat-topic',
        );
      });
      expect(result.current.chatMessages).toEqual([expect.objectContaining({ message: 'hello' })]);

      rerender();
      expect(result.current.chatMessages).toEqual([expect.objectContaining({ message: 'hello' })]);
    },
  );

  it('switches rooms and resets history when the room option changes', () => {
    const firstRoom = new Room();
    const secondRoom = new Room();
    rooms.push(firstRoom, secondRoom);
    let renders = 0;
    const { result, rerender } = renderHook(
      ({ room }) => {
        if (++renders > 20) throw new Error('useChat did not settle with inline options');
        return useChat({ room });
      },
      { initialProps: { room: firstRoom } },
    );
    const receive = (room: Room, message: string) => {
      room.emit(
        RoomEvent.DataReceived,
        new TextEncoder().encode(JSON.stringify({ id: message, timestamp: 1, message })),
        undefined,
        DataPacket_Kind.RELIABLE,
        'lk-chat-topic',
      );
    };

    act(() => receive(firstRoom, 'first room'));
    expect(result.current.chatMessages).toHaveLength(1);
    rerender({ room: secondRoom });
    expect(result.current.chatMessages).toEqual([]);
    act(() => receive(firstRoom, 'old room message'));
    expect(result.current.chatMessages).toEqual([]);
    act(() => receive(secondRoom, 'second room'));
    expect(result.current.chatMessages).toEqual([
      expect.objectContaining({ message: 'second room' }),
    ]);
  });
});
