import * as React from 'react';
/** @public */
export interface AudioConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
}
/**
 * This component is the default setup of a classic LiveKit audio conferencing app.
 * It provides functionality like switching between participant grid view and focus view.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `FocusContextProvider`,
 * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <AudioConference />
 * <LiveKitRoom>
 * ```
 * @public
 */
export declare function AudioConference({ ...props }: AudioConferenceProps): React.JSX.Element;
//# sourceMappingURL=AudioConference.d.ts.map