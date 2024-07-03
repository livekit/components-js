import * as React from 'react';
import { useChatToggle } from '../../hooks';

/** @public */
export interface ChatToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * The `ChatToggle` component is a button that toggles the visibility of the `Chat` component.
 * @remarks
 * For the component to have any effect it has to live inside a `LayoutContext` context.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ToggleChat />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const ChatToggle: (
  props: ChatToggleProps & React.RefAttributes<HTMLButtonElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLButtonElement, ChatToggleProps>(
  function ChatToggle(props: ChatToggleProps, ref) {
    const { mergedProps } = useChatToggle({ props });

    return (
      <button ref={ref} {...mergedProps}>
        {props.children}
      </button>
    );
  },
);
