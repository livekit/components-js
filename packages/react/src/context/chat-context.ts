import type { WidgetState } from '@livekit/components-core';
import type * as React from 'react';

/** @internal */
export type ChatContextAction =
  | { msg: 'show_chat' }
  | { msg: 'hide_chat' }
  | { msg: 'toggle_chat' };

/** @internal */
export type ChatContextType = {
  dispatch?: React.Dispatch<ChatContextAction>;
  state?: WidgetState;
};

/** @internal */
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
