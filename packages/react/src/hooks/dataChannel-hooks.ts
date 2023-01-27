import { BaseDataMessage, setupDataMessageHandler } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from '../helper';

export interface DataChannelMessageProps<T extends BaseDataMessage> {
  channelId: T['channelId'] | [T['channelId'], ...T['channelId'][]];
}

export function useDataChannelMessages<T extends BaseDataMessage>(
  props: DataChannelMessageProps<T>,
) {
  const room = useRoomContext();
  const { send, messageObservable, isSendingObservable } = React.useMemo(
    () => setupDataMessageHandler(room, props.channelId),
    [room, props.channelId],
  );

  const message = useObservableState(messageObservable, undefined);
  const isSending = useObservableState(isSendingObservable, false);

  return {
    message,
    send,
    isSending,
  };
}
