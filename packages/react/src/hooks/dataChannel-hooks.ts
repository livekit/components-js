import { BaseDataMessage, setupDataMessageHandler } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from '../helper';

export function useDataChannelMessages<T extends BaseDataMessage>(channelId: T['channelId']) {
  const room = useRoomContext();
  const { send, messageObservable, isSendingObservable } = React.useMemo(
    () => setupDataMessageHandler(room, channelId),
    [room, channelId],
  );

  const message = useObservableState(messageObservable, undefined);
  const isSending = useObservableState(isSendingObservable, false);

  return {
    message,
    send,
    isSending,
  };
}
