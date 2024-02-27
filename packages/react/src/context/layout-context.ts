import { PIN_DEFAULT_STATE, WIDGET_DEFAULT_STATE } from '@livekit/components-core';
import * as React from 'react';
import type { PinContextType } from './pin-context';
import type { WidgetContextType } from './chat-context';
import { chatReducer } from './chat-context';
import { pinReducer } from './pin-context';

/** @public */
export type LayoutContextType = {
  pin: PinContextType;
  widget: WidgetContextType;
};

/** @public */
export const LayoutContext = React.createContext<LayoutContextType | undefined>(undefined);

/**
 * Ensures that a layout context is provided via context.
 * If no layout context is provided, an error is thrown.
 * @public
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
 * @public
 */
export function useEnsureLayoutContext(layoutContext?: LayoutContextType) {
  const layout = useMaybeLayoutContext();
  layoutContext ??= layout;
  if (!layoutContext) {
    throw Error('Tried to access LayoutContext context outside a LayoutContextProvider provider.');
  }
  return layoutContext;
}

/** @public */
export function useCreateLayoutContext(): LayoutContextType {
  const [pinState, pinDispatch] = React.useReducer(pinReducer, PIN_DEFAULT_STATE);
  const [widgetState, widgetDispatch] = React.useReducer(chatReducer, WIDGET_DEFAULT_STATE);
  return {
    pin: { dispatch: pinDispatch, state: pinState },
    widget: { dispatch: widgetDispatch, state: widgetState },
  };
}

/** @public */
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
 * @public
 */
export function useMaybeLayoutContext(): LayoutContextType | undefined {
  return React.useContext(LayoutContext);
}
