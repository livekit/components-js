import * as React from 'react';
import { useRoomContext } from '../context';

/**
 * @alpha
 */
export function useFileSend() {
  const room = useRoomContext();

  const [isSending, setIsSending] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const sendFile = async (file: File) => {
    setIsSending(true);
    try {
      await room.localParticipant.sendFile(file, { mimeType: file.type, topic: 'user-file' });
    } finally {
      setIsSending(false);
    }
  };

  return { isSending, progress, send: sendFile };
}
