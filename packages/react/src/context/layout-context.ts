import * as React from 'react';
import { ChatContextType, PinContextType } from './index';

// export type LayoutContextAction = ChatContextAction | PinAction;

export type LayoutContextType = {
  pin: PinContextType;
  chat: ChatContextType;
};

// export function layoutReducer(
//   state: LayoutContextState,
//   action: LayoutContextAction,
// ): LayoutContextState {
//   if (isChatContextAction(action)) {
//     return { ...state, chat: chatReducer(state.chat, action) };
//   } else if (isPinContextAction(action)) {
//     return { ...state, pin: pinReducer(state.pin, action) };
//   } else {
//     return { ...state };
//   }
// }

export const LayoutContext = React.createContext<LayoutContextType>({ pin: {}, chat: {} });

export function useLayoutContext() {
  const layoutContext = React.useContext(LayoutContext);

  if (!layoutContext.chat.dispatch || !layoutContext.pin.dispatch) {
    throw Error('Tried to access LayoutContext context outside a LayoutContextProvider provider.');
  }
  return layoutContext;
}

export function useMaybeLayoutContext() {
  return React.useContext(LayoutContext);
}
