import type { WidgetState } from '@livekit/components-core';
import type * as React from 'react';

/** @internal */
export type ChatContextAction =
  | { msg: 'show_chat' }
  | { msg: 'hide_chat' }
  | { msg: 'toggle_chat' }
  | { msg: 'unread_msg' };

/** @internal */
export type ChatContextType = {
  dispatch?: React.Dispatch<ChatContextAction>;
  state?: WidgetState;
};

/** @internal */
export function chatReducer(state: WidgetState, action: ChatContextAction): WidgetState {
  if (action.msg === 'show_chat') {
    return { ...state, showChat: true, hasUnreadMessages: false };
  } else if (action.msg === 'hide_chat') {
    return { ...state, showChat: false };
  } else if (action.msg === 'toggle_chat') {
    const newState = { ...state, showChat: !state.showChat };
    if (newState.showChat === true) {
      console.log('resetting unread');
      newState.hasUnreadMessages = false;
    }
    return newState;
  } else if (action.msg === 'unread_msg') {
    return { ...state, hasUnreadMessages: true };
  } else {
    return { ...state };
  }
}
