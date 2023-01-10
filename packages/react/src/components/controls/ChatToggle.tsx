import { setupChatToggle } from '@livekit/components-core';
import * as React from 'react';
import { useLayoutContext } from '../../context';
import { mergeProps } from '../../utils';

interface UseToggleChatProps {
  props: React.HTMLAttributes<HTMLButtonElement>;
}

function useToggleChat({ props }: UseToggleChatProps) {
  const { dispatch } = useLayoutContext().chat;
  const { className } = React.useMemo(() => setupChatToggle(), []);

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: () => {
          console.log({ dispatch });

          if (dispatch) dispatch({ msg: 'toggle_chat' });
        },
      }),
    [props, className, dispatch],
  );

  return { mergedProps };
}
interface ChatToggleProps extends React.HTMLAttributes<HTMLButtonElement> {}

/**
 * The ToggleChat component shows and hides the chat.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ToggleChat />
 * </LiveKitRoom>
 * ```
 */
export function ChatToggle(props: ChatToggleProps) {
  const { mergedProps } = useToggleChat({ props });

  return <button {...mergedProps}>{props.children}</button>;
}
