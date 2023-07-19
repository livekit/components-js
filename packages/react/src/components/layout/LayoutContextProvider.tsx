import type { PinState, WidgetState } from '@livekit/components-core';
import { log } from '@livekit/components-core';
import * as React from 'react';
import type { LayoutContextType } from '../../context';
import { LayoutContext, useEnsureCreateLayoutContext } from '../../context';

/** @alpha */
export interface LayoutContextProviderProps {
  value?: LayoutContextType;
  onPinChange?: (state: PinState) => void;
  onWidgetChange?: (state: WidgetState) => void;
}

/** @alpha */
export function LayoutContextProvider({
  value,
  onPinChange,
  onWidgetChange,
  children,
}: React.PropsWithChildren<LayoutContextProviderProps>) {
  const layoutContextValue = useEnsureCreateLayoutContext(value);

  React.useEffect(() => {
    log.debug('PinState Updated', { state: layoutContextValue.pin.state });
    if (onPinChange && layoutContextValue.pin.state) onPinChange(layoutContextValue.pin.state);
  }, [layoutContextValue.pin.state, onPinChange]);

  React.useEffect(() => {
    log.debug('Widget Updated', { widgetState: layoutContextValue.widget.state });
    if (onWidgetChange && layoutContextValue.widget.state) {
      onWidgetChange(layoutContextValue.widget.state);
    }
  }, [onWidgetChange, layoutContextValue.widget.state]);

  return <LayoutContext.Provider value={layoutContextValue}>{children}</LayoutContext.Provider>;
}
