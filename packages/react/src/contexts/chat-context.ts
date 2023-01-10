import { ChatContextState } from '@livekit/components-core';
import * as React from 'react';

export type ChatContextAction = { msg: 'show_chat' } | { msg: 'hide_chat' };

export function isChatContextAction(action: { msg: string }): action is ChatContextAction {
  return (
    (action as ChatContextAction).msg === 'show_chat' ||
    (action as ChatContextAction).msg === 'hide_chat'
  );
}

export type ChatContextType = {
  dispatch?: React.Dispatch<ChatContextAction>;
  state?: ChatContextState;
};

export function chatReducer(state: ChatContextState, action: ChatContextAction): ChatContextState {
  if (action.msg === 'show_chat') {
    return { ...state, showChat: true };
  } else if (action.msg === 'hide_chat') {
    return { ...state, showChat: false };
  } else {
    return { ...state };
  }
}
