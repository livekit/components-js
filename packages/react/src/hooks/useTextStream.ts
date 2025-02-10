import * as React from 'react';
import { useRoomContext } from '../context';
import type { TextStreamHandler } from 'livekit-client';

export function useTextStream(topic: string, onTextStreamReceived: TextStreamHandler) {
  const room = useRoomContext();

  React.useEffect(() => {
    room.registerTextStreamHandler(topic, onTextStreamReceived);
    return () => {
      room.unregisterTextStreamHandler(topic);
    };
  }, [room, onTextStreamReceived, topic]);
}
