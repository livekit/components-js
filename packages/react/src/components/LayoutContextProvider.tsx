import { LayoutContextState, LAYOUT_CONTEXT_DEFAULT_STATE } from '@livekit/components-core';
import * as React from 'react';
import { LayoutContext, LayoutContextType, layoutReducer } from '../contexts/layout-context';

type LayoutContextProviderProps = {
  onChange?: (layoutContextState: LayoutContextState) => void;
};

export function LayoutContextProvider({
  onChange,
  children,
}: React.PropsWithChildren<LayoutContextProviderProps>) {
  const [layoutState, layoutDispatch] = React.useReducer(
    layoutReducer,
    LAYOUT_CONTEXT_DEFAULT_STATE,
  );
  const layoutContextDefault: LayoutContextType = { dispatch: layoutDispatch, state: layoutState };

  React.useEffect(() => {
    if (onChange) onChange(layoutState);
  }, [onChange, layoutState]);

  return <LayoutContext.Provider value={layoutContextDefault}>{children}</LayoutContext.Provider>;
}
