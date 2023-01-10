import {
  CHAT_CONTEXT_DEFAULT_STATE,
  PIN_CONTEXT_DEFAULT_STATE,
  PinContextState,
  ChatContextState,
} from '@livekit/components-core';
import * as React from 'react';
import { chatReducer, pinReducer } from '../contexts';
import { LayoutContext, LayoutContextType } from '../contexts/layout-context';

type LayoutContextProviderProps = {
  onPinChange?: (state: PinContextState) => void;
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
    console.log('PinState Updated', { pinState });
    if (onPinChange) onPinChange(pinState);
  }, [onPinChange, pinState]);

  React.useEffect(() => {
    console.log('ChatState Updated', { chatState });
    if (onChatChange) onChatChange(chatState);
  }, [onChatChange, chatState]);

  return <LayoutContext.Provider value={layoutContextDefault}>{children}</LayoutContext.Provider>;
}
