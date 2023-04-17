import * as React from 'react';
import type { LayoutContextType } from '../../context';
import { LayoutContext, useEnsureCreateLayoutContext } from '../../context';

type LayoutContextProviderProps = {
  value?: LayoutContextType;
};

export function LayoutContextProvider({
  value,
  children,
}: React.PropsWithChildren<LayoutContextProviderProps>) {
  const layoutContext = useEnsureCreateLayoutContext(value);
  return <LayoutContext.Provider value={layoutContext}>{children}</LayoutContext.Provider>;
}
