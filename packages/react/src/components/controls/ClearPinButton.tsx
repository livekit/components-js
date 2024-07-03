import * as React from 'react';
import { useClearPinButton } from '../../hooks';

/** @public */
export interface ClearPinButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * The `ClearPinButton` is a basic html button with the added ability to signal
 * the `LayoutContext` that it should display the grid view again.
 * @remarks
 * This component works only inside a `LayoutContext`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ClearPinButton>Back to grid view</ClearPinButton>
 * </LiveKitRoom>
 * ```
 * @public
 */
export const ClearPinButton: (
  props: ClearPinButtonProps & React.RefAttributes<HTMLButtonElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLButtonElement, ClearPinButtonProps>(
  function ClearPinButton(props: ClearPinButtonProps, ref) {
    const { buttonProps } = useClearPinButton(props);
    return (
      <button ref={ref} {...buttonProps}>
        {props.children}
      </button>
    );
  },
);
