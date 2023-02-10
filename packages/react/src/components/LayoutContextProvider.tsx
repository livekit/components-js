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
  useRoomContext,
  createPinContext,
} from '../context';
import { useObservableState } from '../helper';
import { useScreenShare } from './ScreenShareRenderer';

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
  const [widgetState, widgetDispatch] = React.useReducer(chatReducer, WIDGET_DEFAULT_STATE);
  const pinContext = React.useMemo(() => createPinContext(PIN_DEFAULT_STATE), []);

  const layoutContextDefault: LayoutContextType = {
    pin: { observable: pinContext },
    widget: { dispatch: widgetDispatch, state: widgetState },
  };

  const pinState = useObservableState(pinContext, PIN_DEFAULT_STATE);

  React.useEffect(() => {
    log.debug('Pin state Updated', { pinState });
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
      pinContext.next([{ track: screenShareTrack, participant: screenShareParticipant }]);
    } else {
      pinContext.next([]);
    }
  }, [screenShareParticipant, screenShareTrack, pinContext]);

  return <LayoutContext.Provider value={layoutContextDefault}>{children}</LayoutContext.Provider>;
}
