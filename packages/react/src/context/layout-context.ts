import type { LayoutContextState, TrackReference } from '@livekit/components-core';
import { LAYOUT_DEFAULT_STATE } from '@livekit/components-core';
import * as React from 'react';

export type LayoutContextAction =
  | { msg: 'pin.set'; trackReference: TrackReference }
  | { msg: 'pin.clear' }
  | { msg: 'chat.show' }
  | { msg: 'chat.hide' }
  | { msg: 'chat.toggle' };

export function layoutReducer(
  state: LayoutContextState,
  action: LayoutContextAction,
): LayoutContextState {
  switch (action.msg) {
    case 'pin.set':
      return { ...state, pin: [action.trackReference] };
    case 'pin.clear':
      return { ...state, pin: [] };
    case 'chat.show':
      return { ...state, chat: 'open' };
    case 'chat.hide':
      return { ...state, chat: 'closed' };
    case 'chat.toggle':
      return { ...state, chat: state.chat === 'open' ? 'closed' : 'open' };
    default:
      return { ...state };
  }
}

export type LayoutContextType = {
  dispatch?: React.Dispatch<LayoutContextAction>;
  state?: LayoutContextState;
};

export const LayoutContext = React.createContext<LayoutContextType | undefined>(undefined);

/**
 * Ensures that a layout context is provided via context.
 * If no layout context is provided, an error is thrown.
 */
export function useLayoutContext(): LayoutContextType {
  const layoutContext = React.useContext(LayoutContext);
  if (!layoutContext) {
    throw Error('Tried to access LayoutContext context outside a LayoutContextProvider provider.');
  }
  return layoutContext;
}

/**
 * Ensures that a layout context is provided, either via context or explicitly as a parameter.
 * If not inside a `LayoutContext` and no layout context is provided, an error is thrown.
 */
export function useEnsureLayoutContext(layoutContext?: LayoutContextType) {
  const layout = useMaybeLayoutContext();
  layoutContext ??= layout;
  if (!layoutContext) {
    throw Error('Tried to access LayoutContext context outside a LayoutContextProvider provider.');
  }
  return layoutContext;
}

export function useCreateLayoutContext(): LayoutContextType {
  const [state, dispatch] = React.useReducer(layoutReducer, LAYOUT_DEFAULT_STATE);
  return {
    dispatch,
    state,
  };
}

export function useEnsureCreateLayoutContext(layoutContext?: LayoutContextType): LayoutContextType {
  const [state, dispatch] = React.useReducer(layoutReducer, LAYOUT_DEFAULT_STATE);
  return (
    layoutContext ?? {
      dispatch,
      state,
    }
  );
}

/**
 * Returns a layout context from the `LayoutContext` if it exists, otherwise `undefined`.
 */
export function useMaybeLayoutContext(): LayoutContextType | undefined {
  return React.useContext(LayoutContext);
}
