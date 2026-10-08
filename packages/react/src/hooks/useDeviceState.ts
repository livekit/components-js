import * as React from 'react';
import { useMediaDevices } from './useMediaDevices';
import type { DeviceStatus, DeviceStatusInfo } from '@livekit/components-core';

/**
 * Hook that manages the real-time state of media devices including permissions and availability
 * @public
 */
export function useDeviceState() {
  const [deviceStatus, setDeviceStatus] = React.useState<DeviceStatusInfo>({
    audio: 'disabled',
    video: 'disabled',
  });

  const [permissionErrors, setPermissionErrors] = React.useState<{
    audio?: Error;
    video?: Error;
  }>({});

  // Get device lists with permission requests
  const audioDevices = useMediaDevices({
    kind: 'audioinput',
    onError: (error) => setPermissionErrors((prev) => ({ ...prev, audio: error })),
  });

  const videoDevices = useMediaDevices({
    kind: 'videoinput',
    onError: (error) => setPermissionErrors((prev) => ({ ...prev, video: error })),
  });

  // Update device status based on device availability and errors
  React.useEffect(() => {
    const newStatus: DeviceStatusInfo = {
      audio: determineDeviceStatus(audioDevices, permissionErrors.audio),
      video: determineDeviceStatus(videoDevices, permissionErrors.video),
    };

    setDeviceStatus(newStatus);
  }, [audioDevices, videoDevices, permissionErrors]);

  // Clear permission errors when devices become available
  React.useEffect(() => {
    if (audioDevices.length > 0 && permissionErrors.audio) {
      setPermissionErrors((prev) => ({ ...prev, audio: undefined }));
    }
  }, [audioDevices, permissionErrors.audio]);

  React.useEffect(() => {
    if (videoDevices.length > 0 && permissionErrors.video) {
      setPermissionErrors((prev) => ({ ...prev, video: undefined }));
    }
  }, [videoDevices, permissionErrors.video]);

  return {
    deviceStatus,
    permissionErrors,
    audioDevices,
    videoDevices,
    // Helper to check if a device type is available
    isDeviceAvailable: (type: 'audio' | 'video') => deviceStatus[type] === 'available',
    // Helper to check if a device type has permission issues
    hasPermissionError: (type: 'audio' | 'video') => !!permissionErrors[type],
  };
}

/**
 * Determines the status of a device type based on available devices and any errors
 */
function determineDeviceStatus(devices: MediaDeviceInfo[], error?: Error): DeviceStatus {
  if (error) {
    if (error.name === 'NotAllowedError') {
      return 'permission-denied';
    }
    return 'error';
  }

  if (devices.length === 0) {
    return 'no-devices';
  }

  return 'available';
}

