import { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import * as React from 'react';
/** @public */
export interface MediaDeviceSelectProps extends Omit<React.HTMLAttributes<HTMLUListElement>, 'onError'> {
    kind: MediaDeviceKind;
    onActiveDeviceChange?: (deviceId: string) => void;
    onDeviceListChange?: (devices: MediaDeviceInfo[]) => void;
    onDeviceSelectError?: (e: Error) => void;
    initialSelection?: string;
    /** will force the browser to only return the specified device
     * will call `onDeviceSelectError` with the error in case this fails
     */
    exactMatch?: boolean;
    track?: LocalAudioTrack | LocalVideoTrack;
    /**
     * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
     * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
     * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
     * appropriate permissions.
     *
     * @see {@link MediaDeviceMenu}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
     */
    requestPermissions?: boolean;
    onError?: (e: Error) => void;
}
/**
 * The `MediaDeviceSelect` list all media devices of one kind.
 * Clicking on one of the listed devices make it the active media device.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceSelect kind='audioinput' />
 * </LiveKitRoom>
 * ```
 * @public
 */
export declare const MediaDeviceSelect: (props: MediaDeviceSelectProps & React.RefAttributes<HTMLUListElement>) => React.ReactNode;
//# sourceMappingURL=MediaDeviceSelect.d.ts.map