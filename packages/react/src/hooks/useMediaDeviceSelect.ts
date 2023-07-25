import { createMediaDeviceObserver, setupDeviceSelector, log } from '@livekit/components-core';
import type { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
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
}

/** @public */
export function useMediaDeviceSelect({
  kind,
  room,
  track,
  requestPermissions,
}: UseMediaDeviceSelectProps) {
  const roomContext = useMaybeRoomContext();
  // List of all devices.
  const deviceObserver = React.useMemo(
    () => createMediaDeviceObserver(kind, requestPermissions),
    [kind, requestPermissions],
  );
  const devices = useObservableState(deviceObserver, []);
  // Active device management.
  const [currentDeviceId, setCurrentDeviceId] = React.useState<string>('');
  const { className, activeDeviceObservable, setActiveMediaDevice } = React.useMemo(
    () => setupDeviceSelector(kind, room ?? roomContext, track),
    [kind, room, roomContext, track],
  );

  React.useEffect(() => {
    const listener = activeDeviceObservable.subscribe((deviceId) => {
      log.info('setCurrentDeviceId', deviceId);
      if (deviceId) setCurrentDeviceId(deviceId);
    });
    return () => {
      listener?.unsubscribe();
    };
  }, [activeDeviceObservable]);

  return { devices, className, activeDeviceId: currentDeviceId, setActiveMediaDevice };
}
