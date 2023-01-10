import {
  CHAT_CONTEXT_DEFAULT_STATE,
  PIN_CONTEXT_DEFAULT_STATE,
  PinContextState,
  ChatContextState,
} from '@livekit/components-core';
import * as React from 'react';
import {
  LayoutContext,
  LayoutContextType,
  chatReducer,
  pinReducer,
  useRoomContext,
} from '../context';
import { useScreenShare } from './ScreenShareRenderer';

type LayoutContextProviderProps = {
  onPinChange?: (state: PinContextState) => void;
  onChatChange?: (state: ChatContextState) => void;
};

export function LayoutContextProvider({
  onPinChange,
  onChatChange,
  children,
}: React.PropsWithChildren<LayoutContextProviderProps>) {
  const room = useRoomContext();
  const { screenShareParticipant, screenShareTrack } = useScreenShare({ room });
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

  React.useEffect(() => {
    // FIXME: This logic clears the focus if the screenShareParticipant is false.
    // This is also the case when the hook is executed for the first time and then a unwanted clear_focus message is sent.
    if (screenShareParticipant && screenShareTrack) {
      pinDispatch({
        msg: 'set_pin',
        trackParticipantPair: { track: screenShareTrack, participant: screenShareParticipant },
      });
    } else {
      pinDispatch({ msg: 'clear_pin' });
    }
  }, [screenShareParticipant, screenShareTrack]);

  return <LayoutContext.Provider value={layoutContextDefault}>{children}</LayoutContext.Provider>;
}
