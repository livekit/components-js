import { PinContextType } from './pin-context';
import { WidgetContextType } from './chat-context';
import * as React from 'react';
/** @public */
export type LayoutContextType = {
    pin: PinContextType;
    widget: WidgetContextType;
};
/** @public */
export declare const LayoutContext: React.Context<LayoutContextType | undefined>;
/**
 * Ensures that a layout context is provided via context.
 * If no layout context is provided, an error is thrown.
 * @public
 */
export declare function useLayoutContext(): LayoutContextType;
/**
 * Ensures that a layout context is provided, either via context or explicitly as a parameter.
 * If not inside a `LayoutContext` and no layout context is provided, an error is thrown.
 * @public
 */
export declare function useEnsureLayoutContext(layoutContext?: LayoutContextType): LayoutContextType;
/** @public */
export declare function useCreateLayoutContext(): LayoutContextType;
/** @public */
export declare function useEnsureCreateLayoutContext(layoutContext?: LayoutContextType): LayoutContextType;
/**
 * Returns a layout context from the `LayoutContext` if it exists, otherwise `undefined`.
 * @public
 */
export declare function useMaybeLayoutContext(): LayoutContextType | undefined;
//# sourceMappingURL=layout-context.d.ts.map