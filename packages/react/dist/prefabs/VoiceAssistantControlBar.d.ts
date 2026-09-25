import { Track } from 'livekit-client';
import * as React from 'react';
/** @beta */
export type VoiceAssistantControlBarControls = {
    microphone?: boolean;
    leave?: boolean;
};
/** @beta */
export interface VoiceAssistantControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
    onDeviceError?: (error: {
        source: Track.Source;
        error: Error;
    }) => void;
    controls?: VoiceAssistantControlBarControls;
    /**
     * If `true`, the user's device choices will be persisted.
     * This will enables the user to have the same device choices when they rejoin the room.
     * @defaultValue true
     */
    saveUserChoices?: boolean;
}
/**
 * @example
 * ```tsx
 * <LiveKitRoom ... >
 *   <VoiceAssistantControlBar />
 * </LiveKitRoom>
 * ```
 * @beta
 */
export declare function VoiceAssistantControlBar({ controls, saveUserChoices, onDeviceError, ...props }: VoiceAssistantControlBarProps): React.JSX.Element;
//# sourceMappingURL=VoiceAssistantControlBar.d.ts.map