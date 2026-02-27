import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface FocusToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    trackRef?: TrackReferenceOrPlaceholder;
}
/**
 * The `FocusToggle` puts the `ParticipantTile` in focus or removes it from focus.
 * @remarks
 * This component needs to live inside `LayoutContext` to work properly.
 *
 * @example
 * ```tsx
 * <ParticipantTile>
 *   <FocusToggle />
 * </ParticipantTile>
 * ```
 * @public
 */
export declare const FocusToggle: (props: FocusToggleProps & React.RefAttributes<HTMLButtonElement>) => React.ReactNode;
//# sourceMappingURL=FocusToggle.d.ts.map