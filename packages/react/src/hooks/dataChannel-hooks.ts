import { BaseDataMessage, setupDataMessageHandler } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from '../helper';

export interface DataChannelMessageProps<T extends BaseDataMessage> {
  types: [T['type'], ...T['type'][]];
}

export function useDataChannelMessages<T extends BaseDataMessage>(
  props: DataChannelMessageProps<T>,
) {
  const room = useRoomContext();
  const { send, messageObservable } = React.useMemo(
    () => setupDataMessageHandler(room, ...props.types),
    [room, props.types],
  );

  const message = useObservableState(messageObservable, undefined);

  return {
    message,
    send,
  };
}
