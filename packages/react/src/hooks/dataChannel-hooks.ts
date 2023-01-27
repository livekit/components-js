import { channelId, channelIds } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from '../helper';

export interface DataChannelMessageProps<T extends channelId> {
  channelId: T['type'] | [T['type'], ...T['type'][]];
}

export function useDataChannelMessages<T extends channelId>(props: DataChannelMessageProps<T>) {
  const room = useRoomContext();
  const { send, messageObservable, isSendingObservable } = React.useMemo(
    () => channelIds(room, props.channelId),
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
