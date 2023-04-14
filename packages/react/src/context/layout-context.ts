import { PIN_DEFAULT_STATE, WIDGET_DEFAULT_STATE } from '@livekit/components-core';
import * as React from 'react';
import type { ChatContextType, PinContextType } from './index';
import { chatReducer, pinReducer } from './index';

export type LayoutContextType = {
  pin: PinContextType;
  widget: ChatContextType;
};

// export function layoutReducer(
//   state: LayoutContextState,
//   action: LayoutContextAction,
// ): LayoutContextState {
//   if (isChatContextAction(action)) {
//     return { ...state, chat: chatReducer(state.chat, action) };
//   } else if (isPinContextAction(action)) {
//     return { ...state, pin: pinReducer(state.pin, action) };
//   } else {
//     return { ...state };
//   }
// }

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
  const [pinState, pinDispatch] = React.useReducer(pinReducer, PIN_DEFAULT_STATE);
  const [widgetState, widgetDispatch] = React.useReducer(chatReducer, WIDGET_DEFAULT_STATE);
  return {
    pin: { dispatch: pinDispatch, state: pinState },
    widget: { dispatch: widgetDispatch, state: widgetState },
  };
}

export function useEnsureCreateLayoutContext(layoutContext?: LayoutContextType): LayoutContextType {
  const [pinState, pinDispatch] = React.useReducer(pinReducer, PIN_DEFAULT_STATE);
  const [widgetState, widgetDispatch] = React.useReducer(chatReducer, WIDGET_DEFAULT_STATE);
  return (
    layoutContext ?? {
      pin: { dispatch: pinDispatch, state: pinState },
      widget: { dispatch: widgetDispatch, state: widgetState },
    }
  );
}

/**
 * Returns a layout context from the `LayoutContext` if it exists, otherwise `undefined`.
 */
export function useMaybeLayoutContext(): LayoutContextType | undefined {
  return React.useContext(LayoutContext);
}
