import { WidgetState } from '@livekit/components-core';
import * as React from 'react';

export type ChatContextAction =
  | { msg: 'show_chat' }
  | { msg: 'hide_chat' }
  | { msg: 'toggle_chat' };

export function isChatContextAction(action: { msg: string }): action is ChatContextAction {
  return (
    (action as ChatContextAction).msg === 'show_chat' ||
    (action as ChatContextAction).msg === 'hide_chat'
  );
}

export type ChatContextType = {
  dispatch?: React.Dispatch<ChatContextAction>;
  state?: WidgetState;
};

export function chatReducer(state: WidgetState, action: ChatContextAction): WidgetState {
  if (action.msg === 'show_chat') {
    return { ...state, showChat: true };
  } else if (action.msg === 'hide_chat') {
    return { ...state, showChat: false };
  } else if (action.msg === 'toggle_chat') {
    return { ...state, showChat: !state.showChat };
  } else {
    return { ...state };
  }
}
