import { setupChatToggle } from '@livekit/components-core';
import { useLayoutContext } from '../context';
import { mergeProps } from '../mergeProps';
import * as React from 'react';

/** @public */
export interface UseChatToggleProps {
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

/** @public */
export function useChatToggle({ props }: UseChatToggleProps) {
  const { dispatch, state } = useLayoutContext().widget;
  const { className } = React.useMemo(() => setupChatToggle(), []);

  const mergedProps = React.useMemo(() => {
    return mergeProps(props, {
      className,
      onClick: () => {
        if (dispatch) dispatch({ msg: 'toggle_chat' });
      },
      'aria-pressed': state?.showChat ? 'true' : 'false',
      'data-lk-unread-msgs': state
        ? state.unreadMessages < 10
          ? state.unreadMessages.toFixed(0)
          : '9+'
        : '0',
    });
  }, [props, className, dispatch, state]);

  return { mergedProps };
}
