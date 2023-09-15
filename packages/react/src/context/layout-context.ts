import { PIN_DEFAULT_STATE, WIDGET_DEFAULT_STATE } from '@livekit/components-core';
import * as React from 'react';
import type { PinContextType } from './pin-context';
import type { ChatContextType } from './chat-context';
import { chatReducer } from './chat-context';
import { pinReducer } from './pin-context';
import { isEnsureFalse, isEnsureContext } from './context-types';
import type { ContextHookOptions, ConditionalReturnType } from './context-types';

/** @public */
export type LayoutContextType = {
  pin: PinContextType;
  widget: ChatContextType;
};

/** @public */
export const LayoutContext = React.createContext<LayoutContextType | undefined>(undefined);

/**
 * The `useLayoutContext` hook returns the `LayoutContext` or `undefined` depending on its input.
 *
 * @example
 * ```tsx
 * // Garanteed to return a LayoutContext or throw an error.
 * const context = useLayoutContext();
 * const context = useLayoutContext(layoutContext);
 *
 * // Returns a LayoutContext or undefined.
 * const context = useLayoutContext({maybeUndefined: true});
 * ```
 * @throws Error - If the the return value is not allowed to be `undefined`
 * and the hook is used outside of a `LayoutContextProvider`.
 * @public
 */
export function useLayoutContext<
  ContentType extends LayoutContextType,
  Options extends ContextHookOptions<ContentType> = undefined,
>(options?: Options): ConditionalReturnType<ContentType, Options> {
  const context = React.useContext(LayoutContext);
  if (isEnsureFalse<ContentType>(options)) {
    // Case: {ensure: false} -> LayoutContextType | undefined
    return context as ConditionalReturnType<ContentType, Options>;
  } else if (context) {
    if (options === undefined) {
      // Case: (undefined) -> LayoutContextType
      return context as ConditionalReturnType<ContentType, Options>;
    } else if (isEnsureContext<ContentType>(options)) {
      // Case: (LayoutContextType) -> LayoutContextType
      return options as unknown as ConditionalReturnType<ContentType, Options>;
    }
  }
  throw Error('Tried to access LayoutContext context outside a LayoutContextProvider provider.');
}

/**
 * Returns a layout context from the `LayoutContext` if it exists, otherwise `undefined`.
 * @deprecated This hook will be removed soon use `useLayoutContext({maybeUndefined: true})` instead.
 * @public
 */
export function useMaybeLayoutContext(): LayoutContextType | undefined {
  return useLayoutContext({ maybeUndefined: true });
}

/**
 * Ensures that a layout context is provided, either via context or explicitly as a parameter.
 * If not inside a `LayoutContext` and no layout context is provided, an error is thrown.
 * @deprecated This hook will be removed soon use `useLayoutContext(layoutContext)` instead.
 * @public
 */
export function useEnsureLayoutContext(layoutContext?: LayoutContextType) {
  return useLayoutContext(layoutContext);
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
