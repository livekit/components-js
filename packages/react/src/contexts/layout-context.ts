import { LayoutContextState } from '@livekit/components-core';
import * as React from 'react';
import {
  ChatContextAction,
  chatReducer,
  isChatContextAction,
  isPinContextAction,
  PinAction,
  pinReducer,
} from './index';

export type LayoutContextAction = ChatContextAction | PinAction;

export type LayoutContextType = {
  dispatch?: React.Dispatch<LayoutContextAction>;
  state?: LayoutContextState;
};

export function layoutReducer(
  state: LayoutContextState,
  action: LayoutContextAction,
): LayoutContextState {
  if (isChatContextAction(action)) {
    return { ...state, chat: chatReducer(state.chat, action) };
  } else if (isPinContextAction(action)) {
    return { ...state, pin: pinReducer(state.pin, action) };
  } else {
    return { ...state };
  }
}

export const LayoutContext = React.createContext<LayoutContextType>({});

export function useLayoutContext() {
  const layoutContext = React.useContext(LayoutContext);
  if (!layoutContext) {
    throw Error('Tried to access LayoutContext context outside a LayoutContextProvider provider.');
  }
  return layoutContext;
}

export function useMaybeLayoutContext() {
  return React.useContext(LayoutContext);
}
