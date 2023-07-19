import * as React from 'react';
import { useToggleChat } from '../../hooks';

/** @public */
export interface ChatToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * The ChatToggle component toggles the visibility of the chat component.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ToggleChat />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function ChatToggle(props: ChatToggleProps) {
  const { mergedProps } = useToggleChat({ props });

  return <button {...mergedProps}>{props.children}</button>;
}
