import * as React from 'react';
/** @public */
export interface UseChatToggleProps {
    props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}
/**
 * The `useChatToggle` hook provides state and functions for toggling the chat window.
 * @remarks
 * Depends on the `LayoutContext` to work properly.
 * @see {@link ChatToggle}, {@link Chat}
 * @public
 */
export declare function useChatToggle({ props }: UseChatToggleProps): {
    mergedProps: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        className: string;
        onClick: () => void;
        'aria-pressed': string;
        'data-lk-unread-msgs': string;
    };
};
//# sourceMappingURL=useChatToggle.d.ts.map