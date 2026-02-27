import * as React from 'react';
/** @public */
export interface ChatToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
}
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
export declare const ChatToggle: (props: ChatToggleProps & React.RefAttributes<HTMLButtonElement>) => React.ReactNode;
//# sourceMappingURL=ChatToggle.d.ts.map