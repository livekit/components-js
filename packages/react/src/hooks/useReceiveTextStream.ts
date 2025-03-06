import * as React from 'react';
import { useRoomContext } from '../context';
import type { TextStreamHandler } from 'livekit-client';

/**
 * @beta
 * set up a text stream handler for the given topic
 * @param topic - the topic to listen to
 * @param onTextStreamReceived - the handler to call when a text stream is received
 * @returns a function to unregister the text stream handler
 */
export function useReceiveTextStream(topic: string, onTextStreamReceived: TextStreamHandler) {
  const room = useRoomContext();

  React.useEffect(() => {
    room.registerTextStreamHandler(topic, onTextStreamReceived);
    return () => {
      room.unregisterTextStreamHandler(topic);
    };
  }, [room, onTextStreamReceived, topic]);
}
