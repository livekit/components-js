import * as React from 'react';
import { useRoomContext } from '../context';
import type { ByteStreamHandler } from 'livekit-client';

/**
 * @beta
 * set up a byte stream handler for the given topic
 * @param topic - the topic to listen to
 * @param onByteStreamReceived - the handler to call when a byte stream is received
 * @returns a function to unregister the byte stream handler
 */
export function useReceiveByteStream(topic: string, onByteStreamReceived: ByteStreamHandler) {
  const room = useRoomContext();

  React.useEffect(() => {
    room.registerByteStreamHandler(topic, onByteStreamReceived);
    return () => {
      room.unregisterByteStreamHandler(topic);
    };
  }, [room, onByteStreamReceived, topic]);
}
