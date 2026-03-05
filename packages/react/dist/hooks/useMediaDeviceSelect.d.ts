import { Room, LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
/** @public */
export interface UseMediaDeviceSelectProps {
    kind: MediaDeviceKind;
    room?: Room;
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
    /**
     * this callback gets called if an error is thrown when failing to select a device and also if a user
     * denied permissions, eventhough the `requestPermissions` option is set to `true`.
     * Most commonly this will emit a MediaDeviceError
     */
    onError?: (e: Error) => void;
}
/**
 * The `useMediaDeviceSelect` hook is used to implement the `MediaDeviceSelect` component and
 * returns o.a. the list of devices of a given kind (audioinput or videoinput), the currently active device
 * and a function to set the the active device.
 *
 * @example
 * ```tsx
 * const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({kind: 'audioinput'});
 * ```
 * @public
 */
export declare function useMediaDeviceSelect({ kind, room, track, requestPermissions, onError, }: UseMediaDeviceSelectProps): {
    devices: MediaDeviceInfo[];
    className: string;
    activeDeviceId: string;
    setActiveMediaDevice: (id: string, options?: import('@livekit/components-core').SetMediaDeviceOptions) => Promise<void>;
};
//# sourceMappingURL=useMediaDeviceSelect.d.ts.map