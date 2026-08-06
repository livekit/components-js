import { CreateLocalTracksOptions, LocalAudioTrack, LocalVideoTrack, TrackProcessor, Track } from 'livekit-client';
import { LocalUserChoices } from '@livekit/components-core';
import * as React from 'react';
/**
 * Props for the PreJoin component.
 * @public
 */
export interface PreJoinProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit' | 'onError'> {
    /** This function is called with the `LocalUserChoices` if validation is passed. */
    onSubmit?: (values: LocalUserChoices) => void;
    /**
     * Provide your custom validation function. Only if validation is successful the user choices are past to the onSubmit callback.
     */
    onValidate?: (values: LocalUserChoices) => boolean;
    onError?: (error: Error) => void;
    /** Prefill the input form with initial values. */
    defaults?: Partial<LocalUserChoices>;
    /** Display a debug window for your convenience. */
    debug?: boolean;
    joinLabel?: string;
    micLabel?: string;
    camLabel?: string;
    userLabel?: string;
    /**
     * If true, user choices are persisted across sessions.
     * @defaultValue true
     * @alpha
     */
    persistUserChoices?: boolean;
    videoProcessor?: TrackProcessor<Track.Kind.Video>;
}
/** @public */
export declare function usePreviewTracks(options: CreateLocalTracksOptions, onError?: (err: Error) => void): (LocalAudioTrack | LocalVideoTrack)[] | undefined;
/**
 * @public
 * @deprecated use `usePreviewTracks` instead
 */
export declare function usePreviewDevice<T extends LocalVideoTrack | LocalAudioTrack>(enabled: boolean, deviceId: string, kind: 'videoinput' | 'audioinput'): {
    selectedDevice: MediaDeviceInfo | undefined;
    localTrack: T | undefined;
    deviceError: Error | null;
};
/**
 * The `PreJoin` prefab component is normally presented to the user before he enters a room.
 * This component allows the user to check and select the preferred media device (camera und microphone).
 * On submit the user decisions are returned, which can then be passed on to the `LiveKitRoom` so that the user enters the room with the correct media devices.
 *
 * @remarks
 * This component is independent of the `LiveKitRoom` component and should not be nested within it.
 * Because it only accesses the local media tracks this component is self-contained and works without connection to the LiveKit server.
 *
 * @example
 * ```tsx
 * <PreJoin />
 * ```
 * @public
 */
export declare function PreJoin({ defaults, onValidate, onSubmit, onError, debug, joinLabel, micLabel, camLabel, userLabel, persistUserChoices, videoProcessor, ...htmlProps }: PreJoinProps): React.JSX.Element;
//# sourceMappingURL=PreJoin.d.ts.map