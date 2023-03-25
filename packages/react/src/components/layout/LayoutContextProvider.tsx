import {
  WIDGET_DEFAULT_STATE,
  PIN_DEFAULT_STATE,
  PinState,
  WidgetState,
  log,
} from '@livekit/components-core';
import * as React from 'react';
import { LayoutContext, LayoutContextType, chatReducer, pinReducer } from '../../context';

type LayoutContextProviderProps = {
  value?: LayoutContextType;
  onPinChange?: (state: PinState) => void;
  onWidgetChange?: (state: WidgetState) => void;
};

export function useCreateLayoutContext(): LayoutContextType {
  const [pinState, pinDispatch] = React.useReducer(pinReducer, PIN_DEFAULT_STATE);
  const [widgetState, widgetDispatch] = React.useReducer(chatReducer, WIDGET_DEFAULT_STATE);
  return {
    pin: { dispatch: pinDispatch, state: pinState },
    widget: { dispatch: widgetDispatch, state: widgetState },
  };
}

export function LayoutContextProvider({
  value,
  onPinChange,
  onWidgetChange,
  children,
}: React.PropsWithChildren<LayoutContextProviderProps>) {
  const [pinState, pinDispatch] = React.useReducer(pinReducer, PIN_DEFAULT_STATE);
  const [widgetState, widgetDispatch] = React.useReducer(chatReducer, WIDGET_DEFAULT_STATE);

  const layoutContextValue: LayoutContextType = React.useMemo(
    () =>
      value ?? {
        pin: { dispatch: pinDispatch, state: pinState },
        widget: { dispatch: widgetDispatch, state: widgetState },
      },
    [value],
  );

  React.useEffect(() => {
    log.debug('PinState Updated', { state: layoutContextValue.pin.state });
    if (onPinChange && layoutContextValue.pin.state) onPinChange(layoutContextValue.pin.state);
  }, [layoutContextValue.pin.state, onPinChange]);

  React.useEffect(() => {
    log.debug('Widget Updated', { widgetState });
    if (onWidgetChange) onWidgetChange(widgetState);
  }, [onWidgetChange, widgetState]);

  return <LayoutContext.Provider value={layoutContextValue}>{children}</LayoutContext.Provider>;
}
