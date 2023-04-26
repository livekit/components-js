import { setupChatToggle } from '@livekit/components-core';
import * as React from 'react';
import { useLayoutContext } from '../../context';
import { mergeProps } from '../../utils';

interface UseToggleChatProps {
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

function useToggleChat({ props }: UseToggleChatProps) {
  const { dispatch } = useLayoutContext().widget;
  const { className } = React.useMemo(() => setupChatToggle(), []);

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: () => {
          if (dispatch) dispatch({ msg: 'toggle_chat' });
        },
      }),
    [props, className, dispatch],
  );

  return { mergedProps };
}

/** @public */
export type ChatToggleProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

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
