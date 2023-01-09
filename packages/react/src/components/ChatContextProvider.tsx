import { ChatContextState, CHAT_CONTEXT_DEFAULT_STATE } from '@livekit/components-core';
import * as React from 'react';
import { ChatContext, chatReducer } from '../contexts';

type ChatContextProviderProps = {
  onChange?: (chatContextState: ChatContextState) => void;
};

export function ChatContextProvider({
  onChange,
  children,
}: React.PropsWithChildren<ChatContextProviderProps>) {
  const [state, dispatch] = React.useReducer(chatReducer, CHAT_CONTEXT_DEFAULT_STATE);
  const initChatContext = { dispatch, state };

  React.useEffect(() => {
    if (onChange) onChange(state);
  }, [onChange, state]);

  return <ChatContext.Provider value={initChatContext}>{children}</ChatContext.Provider>;
}
