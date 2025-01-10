import { createMediaDeviceObserver, setupDeviceSelector, log } from '@livekit/components-core';
import { Room, type LocalAudioTrack, type LocalVideoTrack } from 'livekit-client';
import * as React from 'react';
import { useMaybeRoomContext } from '../context';
import { useObservableState } from './internal';

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
export function useMediaDeviceSelect({
  kind,
  room,
  track,
  requestPermissions,
  onError,
}: UseMediaDeviceSelectProps) {
  const roomContext = useMaybeRoomContext();

  const roomFallback = React.useMemo(() => room ?? roomContext ?? new Room(), [room, roomContext]);

  // List of all devices.
  const deviceObserver = React.useMemo(
    () => createMediaDeviceObserver(kind, onError, requestPermissions),
    [kind, requestPermissions, onError],
  );
  const devices = useObservableState(deviceObserver, [] as MediaDeviceInfo[]);
  // Active device management.
  const [currentDeviceId, setCurrentDeviceId] = React.useState<string>(
    roomFallback?.getActiveDevice(kind) ?? 'default',
  );
  const { className, activeDeviceObservable, setActiveMediaDevice } = React.useMemo(
    () => setupDeviceSelector(kind, roomFallback),
    [kind, roomFallback, track],
  );

  React.useEffect(() => {
    const listener = activeDeviceObservable.subscribe((deviceId) => {
      if (!deviceId) {
        return;
      }
      log.info('setCurrentDeviceId', deviceId);
      setCurrentDeviceId(deviceId);
    });
    return () => {
      listener?.unsubscribe();
    };
  }, [activeDeviceObservable]);

  return { devices, className, activeDeviceId: currentDeviceId, setActiveMediaDevice };
}
