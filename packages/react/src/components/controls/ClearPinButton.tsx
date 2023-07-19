import * as React from 'react';
import { useClearPinButton } from '../../hooks';

/** @public */
export interface ClearPinButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * The ClearPinButton is a basic html button with the added ability to signal
 * the LiveKitRoom that it should display the grid view again.
 *
 * @remarks
 * This component works only inside a PinContext.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ClearPinButton>Leave room</ClearPinButton>
 * </LiveKitRoom>
 * ```
 * @public
 */
export function ClearPinButton(props: ClearPinButtonProps) {
  const { buttonProps } = useClearPinButton(props);
  return <button {...buttonProps}>{props.children}</button>;
}
