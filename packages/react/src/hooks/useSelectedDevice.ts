import { type LocalAudioTrack, type LocalVideoTrack } from 'livekit-client';
import * as React from 'react';
import { useMediaDevices } from './useMediaDevices';

/**
 * /**
 * The `useSelectedDevice` hook returns the current selected device (audio or video) of the participant.
 *
 * @example
 * ```tsx
 * const { selectedDevice } = useSelectedDevice({
 *   kind: 'videoinput',
 *   track: track,
 * });
 *
 * <div>
 *  {selectedDevice?.label}
 * </div>
 * ```
 * @public
 */
export function useSelectedDevice<T extends LocalVideoTrack | LocalAudioTrack>({
  kind,
  track,
  deviceId,
}: {
  kind: 'videoinput' | 'audioinput';
  track?: T;
  deviceId?: string;
}) {
  const [deviceError, setDeviceError] = React.useState<Error | null>(null);

  const devices = useMediaDevices({ kind });
  const [selectedDevice, setSelectedDevice] = React.useState<MediaDeviceInfo | undefined>(
    undefined,
  );
  const [localDeviceId, setLocalDeviceId] = React.useState<string | undefined>(deviceId);

  const prevDeviceId = React.useRef(localDeviceId);

  const getDeviceId = async () => {
    try {
      const newDeviceId = await track?.getDeviceId(false);
      if (newDeviceId && localDeviceId !== newDeviceId) {
        prevDeviceId.current = newDeviceId;
        setLocalDeviceId(newDeviceId);
      }
    } catch (e) {
      if (e instanceof Error) {
        setDeviceError(e);
      }
    }
  };

  React.useEffect(() => {
    if (track) getDeviceId();
  }, [track]);

  React.useEffect(() => {
    // in case track doesn't exist, utilize the deviceId passed in
    if (!track) setLocalDeviceId(deviceId);
  }, [deviceId]);

  React.useEffect(() => {
    setSelectedDevice(devices?.find((dev) => dev.deviceId === localDeviceId));
  }, [localDeviceId, devices]);

  return {
    selectedDevice,
    deviceError,
  };
}
