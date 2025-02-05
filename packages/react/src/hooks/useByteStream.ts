import * as React from 'react';
import { useRoomContext } from '../context';
import type { ByteStreamHandler } from 'livekit-client';

export function useByteStream(topic: string, onByteStreamReceived: ByteStreamHandler) {
  const room = useRoomContext();

  React.useEffect(() => {
    room.registerByteStreamHandler(topic, onByteStreamReceived);
    return () => {
      room.unregisterByteStreamHandler(topic);
    };
  }, [room, onByteStreamReceived, topic]);
}
