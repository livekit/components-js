import * as React from 'react';
import { useChatToggle } from '../../hooks';

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
  const { mergedProps } = useChatToggle({ props });

  return <button {...mergedProps}>{props.children}</button>;
}
