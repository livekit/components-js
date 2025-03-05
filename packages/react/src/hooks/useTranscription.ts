import * as React from 'react';
import { useTextStream } from './useTextStream';

export function useTranscription(participantIdentity: string) {
  const { textStreams } = useTextStream('lk.chat');

  const filteredMessages = React.useMemo(
    () => textStreams.filter((stream) => stream.participantInfo.identity === participantIdentity),
    [textStreams, participantIdentity],
  );

  const activeTranscription = React.useMemo(() => {
    return filteredMessages.at(-1);
  }, [filteredMessages]);

  return { activeTranscription: activeTranscription, transcriptions: filteredMessages };
}
