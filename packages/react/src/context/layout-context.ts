import { PIN_DEFAULT_STATE, WIDGET_DEFAULT_STATE } from '@livekit/components-core';
import * as React from 'react';
import type { PinContextType } from './pin-context';
import type { ChatContextType } from './chat-context';
import { chatReducer } from './chat-context';
import { pinReducer } from './pin-context';

/** @public */
export type LayoutContextType = {
  pin: PinContextType;
  widget: ChatContextType;
};

/** @public */
export const LayoutContext = React.createContext<LayoutContextType | undefined>(undefined);

/**
 * Returns a layout context from the `LayoutContext` if it exists, otherwise `undefined`.
 * @public
 */
export function useMaybeLayoutContext(): LayoutContextType | undefined {
  return React.useContext(LayoutContext);
}

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

type OptionMaybeContext = undefined;
type OptionEnsureContext = { ensure: true };
type HookContextOptions = undefined | { ensure: true };
export type UseLayoutContextReturnType<InputType> = InputType extends OptionMaybeContext
  ? LayoutContextType | undefined
  : InputType extends OptionEnsureContext
  ? LayoutContextType
  : never;

export function useTestLayoutContext<T extends HookContextOptions>(
  options?: T,
): UseLayoutContextReturnType<T> {
  const context = React.useContext(LayoutContext);
  if (options?.ensure === true) {
    if (context === undefined) {
      throw Error(
        'Tried to access LayoutContext context outside a LayoutContextProvider provider.',
      );
    } else {
      return context as UseLayoutContextReturnType<T>;
    }
  }
  return context as UseLayoutContextReturnType<T>;
}
