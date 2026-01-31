import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface UseFocusToggleProps {
    trackRef?: TrackReferenceOrPlaceholder;
    props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}
/**
 * The `useFocusToggle` hook is used to implement the `FocusToggle` or your custom implementation of it.
 * The `TrackReferenceOrPlaceholder` is used to register a onClick handler and to identify the track to focus on.
 *
 * @example
 * ```tsx
 * const { mergedProps, inFocus } = useFocusToggle({ trackRef, props: yourButtonProps });
 * return <button {...mergedProps}>{inFocus ? 'Unfocus' : 'Focus'}</button>;
 * ```
 * @public
 */
export declare function useFocusToggle({ trackRef, props }: UseFocusToggleProps): {
    mergedProps: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        className: string;
        onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    };
    inFocus: boolean;
};
//# sourceMappingURL=useFocusToggle.d.ts.map