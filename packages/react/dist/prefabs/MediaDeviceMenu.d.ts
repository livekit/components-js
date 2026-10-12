import { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import * as React from 'react';
/** @public */
export interface MediaDeviceMenuProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    kind?: MediaDeviceKind;
    initialSelection?: string;
    onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
    tracks?: Partial<Record<MediaDeviceKind, LocalAudioTrack | LocalVideoTrack | undefined>>;
    /**
     * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
     * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
     * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
     * appropriate permissions.
     *
     * @see {@link PreJoin}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
     */
    requestPermissions?: boolean;
}
/**
 * The `MediaDeviceMenu` component is a button that opens a menu that lists
 * all media devices and allows the user to select them.
 *
 * @remarks
 * This component is implemented with the `MediaDeviceSelect` LiveKit components.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceMenu />
 * </LiveKitRoom>
 * ```
 * @public
 */
export declare function MediaDeviceMenu({ kind, initialSelection, onActiveDeviceChange, tracks, requestPermissions, ...props }: MediaDeviceMenuProps): React.JSX.Element;
//# sourceMappingURL=MediaDeviceMenu.d.ts.map