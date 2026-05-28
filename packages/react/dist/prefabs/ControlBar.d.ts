import { Track } from 'livekit-client';
import * as React from 'react';
/** @public */
export type ControlBarControls = {
    microphone?: boolean;
    camera?: boolean;
    chat?: boolean;
    screenShare?: boolean;
    leave?: boolean;
    settings?: boolean;
};
/** @public */
export interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
    onDeviceError?: (error: {
        source: Track.Source;
        error: Error;
    }) => void;
    variation?: 'minimal' | 'verbose' | 'textOnly';
    controls?: ControlBarControls;
    /**
     * If `true`, the user's device choices will be persisted.
     * This will enable the user to have the same device choices when they rejoin the room.
     * @defaultValue true
     * @alpha
     */
    saveUserChoices?: boolean;
}
/**
 * The `ControlBar` prefab gives the user the basic user interface to control their
 * media devices (camera, microphone and screen share), open the `Chat` and leave the room.
 *
 * @remarks
 * This component is build with other LiveKit components like `TrackToggle`,
 * `DeviceSelectorButton`, `DisconnectButton` and `StartAudio`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ControlBar />
 * </LiveKitRoom>
 * ```
 * @public
 */
export declare function ControlBar({ variation, controls, saveUserChoices, onDeviceError, ...props }: ControlBarProps): React.JSX.Element;
//# sourceMappingURL=ControlBar.d.ts.map