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

//www.typescriptlang.org/play?#code/C4TwDgpgBA8mwEsD2A7AqigJhAZglEmUAvFAK5a76EDcAUKJLPMigKIoDOZAThAGIBDADadopAN5QIXXhABcUHCLFQAvvUbQ4iVB258A6gmAALAMKpgEAB7AAPJZTW7AFXAQAfCShOXwd0h6Bg9fK1tgAAkkJABrHVZOR3C3cG9iOigsqAAfZl10SjwCTEzsvIS9WT4hUQgyrIqWKoMIYzM-COTnCMDPYK0wrBNWEQAlCGBeFECIbv9ZgBooV3SGlek7GUxOfNYMbGLCXKGF0IB+U97Q+XXXTessXcr2aoEVaEvO1KY8ikPqERbtkoAQAG4QHjBHAUADGBXIYm+URisXm1yYEW2uwAImQALb4kDI5b3LFPK52aJxF5JZGzdLkIqAzwACnWSGaXHOilcdAAlIonJgRqhxpNprN0T8IMstEgcFBOQVON4JOsAPQaqD8OEIgBGSEwICgpkhEAAdFbNdr+EgeFAzNBOIJYtAFY7TAhdrZBPiwMJZVAAJIAcmEwigACsyJxgFA+FMeCgoIIoJgCUSoGCRGRLetE9MoBI1KndsLRShxUmZh5pQEPHKPB7lYl+nQ1HQ6FqoGgXQBzBR0fDWHjKWHQPGE4kpePqkEZ6eKOM8fD9jtd2GoOMJiDcYTAABMPljEGR1NirP5NCgPbYNkg8OOWkUU6JyLoW648b43GAwgAZhPJFZwvVkpEXIlFFDaw41DdR+VvbV70fawiBfKA3xnHo7E-bcfz3MgDwARmAs9QNRcDpDeRRlDqBCbx7WZX0zbD-BOf4qBKIA

// TODO: custom error for missing context.
export function useMegaLayoutContext<
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
