import * as React from 'react';
/** @alpha */
export interface UseSettingsToggleProps {
    props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}
/**
 * The `useSettingsToggle` hook provides state and functions for toggling the settings menu.
 * @remarks
 * Depends on the `LayoutContext` to work properly.
 * @see {@link SettingsMenu}
 * @alpha
 */
export declare function useSettingsToggle({ props }: UseSettingsToggleProps): {
    mergedProps: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        className: string;
        onClick: () => void;
        'aria-pressed': string;
    };
};
//# sourceMappingURL=useSettingsToggle.d.ts.map