import {
  WIDGET_DEFAULT_STATE,
  PIN_DEFAULT_STATE,
  PinState,
  WidgetState,
  log,
} from '@livekit/components-core';
import * as React from 'react';
import {
  LayoutContext,
  LayoutContextType,
  chatReducer,
  pinReducer,
  useRoomContext,
} from '../../context';
import { useScreenShare } from '../participant/ScreenShareRenderer';

type LayoutContextProviderProps = {
  onPinChange?: (state: PinState) => void;
  onWidgetChange?: (state: WidgetState) => void;
};

export function LayoutContextProvider({
  onPinChange,
  onWidgetChange,
  children,
}: React.PropsWithChildren<LayoutContextProviderProps>) {
  const room = useRoomContext();
  const { screenShareParticipant, screenShareTrack } = useScreenShare({ room });
  const [pinState, pinDispatch] = React.useReducer(pinReducer, PIN_DEFAULT_STATE);
  const [widgetState, widgetDispatch] = React.useReducer(chatReducer, WIDGET_DEFAULT_STATE);

  const layoutContextDefault: LayoutContextType = {
    pin: { dispatch: pinDispatch, state: pinState },
    widget: { dispatch: widgetDispatch, state: widgetState },
  };

  React.useEffect(() => {
    log.debug('PinState Updated', { pinState });
    if (onPinChange) onPinChange(pinState);
  }, [onPinChange, pinState]);

  React.useEffect(() => {
    log.debug('Widget Updated', { widgetState });
    if (onWidgetChange) onWidgetChange(widgetState);
  }, [onWidgetChange, widgetState]);

  React.useEffect(() => {
    // FIXME: This logic clears the focus if the screenShareParticipant is false.
    // This is also the case when the hook is executed for the first time and then a unwanted clear_focus message is sent.
    if (screenShareParticipant && screenShareTrack) {
      pinDispatch({
        msg: 'set_pin',
        trackBundle: {
          participant: screenShareParticipant,
          publication: screenShareTrack,
        },
      });
    } else {
      pinDispatch({ msg: 'clear_pin' });
    }
  }, [screenShareParticipant, screenShareTrack]);

  return <LayoutContext.Provider value={layoutContextDefault}>{children}</LayoutContext.Provider>;
}
