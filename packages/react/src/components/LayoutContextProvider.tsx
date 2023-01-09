import {
  CHAT_CONTEXT_DEFAULT_STATE,
  PIN_CONTEXT_DEFAULT_STATE,
  PinState,
  ChatContextState,
} from '@livekit/components-core';
import * as React from 'react';
import { chatReducer, pinReducer } from '../contexts';
import { LayoutContext, LayoutContextType } from '../contexts/layout-context';

type LayoutContextProviderProps = {
  onPinChange?: (state: PinState) => void;
  onChatChange?: (state: ChatContextState) => void;
};

export function LayoutContextProvider({
  onPinChange,
  onChatChange,
  children,
}: React.PropsWithChildren<LayoutContextProviderProps>) {
  const [pinState, pinDispatch] = React.useReducer(pinReducer, PIN_CONTEXT_DEFAULT_STATE);
  const [chatState, chatDispatch] = React.useReducer(chatReducer, CHAT_CONTEXT_DEFAULT_STATE);

  const layoutContextDefault: LayoutContextType = {
    pin: { dispatch: pinDispatch, state: pinState },
    chat: { dispatch: chatDispatch, state: chatState },
  };

  React.useEffect(() => {
    if (onPinChange) onPinChange(pinState);
  }, [onPinChange, pinState]);

  React.useEffect(() => {
    if (onChatChange) onChatChange(chatState);
  }, [onChatChange, chatState]);

  return <LayoutContext.Provider value={layoutContextDefault}>{children}</LayoutContext.Provider>;
}
