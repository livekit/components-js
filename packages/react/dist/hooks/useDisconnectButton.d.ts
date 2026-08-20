import { DisconnectButtonProps } from '../components';
/**
 * The `useDisconnectButton` hook is used to implement the `DisconnectButton` or your
 * custom implementation of it. It adds onClick handler to the button to disconnect
 * from the room.
 *
 * @example
 * ```tsx
 * const { buttonProps } = useDisconnectButton(buttonProps);
 * return <button {...buttonProps}>Disconnect</button>;
 * ```
 * @public
 */
export declare function useDisconnectButton(props: DisconnectButtonProps): {
    buttonProps: DisconnectButtonProps & {
        className: string;
        onClick: () => void;
        disabled: boolean;
    };
};
//# sourceMappingURL=useDisconnectButton.d.ts.map