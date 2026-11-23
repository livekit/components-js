import { ClearPinButtonProps } from '../components';
/**
 * The `useClearPinButton` hook provides props for the {@link ClearPinButton}
 * or your custom implementation of it component. It adds the `onClick` handler
 * to signal the `LayoutContext` that the tile in focus should be cleared.
 * @public
 */
export declare function useClearPinButton(props: ClearPinButtonProps): {
    buttonProps: ClearPinButtonProps & {
        className: string;
        disabled: boolean;
        onClick: () => void;
    };
};
//# sourceMappingURL=useClearPinButton.d.ts.map