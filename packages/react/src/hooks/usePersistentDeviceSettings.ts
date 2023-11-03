import type { DeviceSettings } from '@livekit/components-core';
import { getDeviceSettings, setDeviceSettings } from '@livekit/components-core';
import * as React from 'react';

/**
 * Options for the `usePersistentDeviceSettings` hook.
 * @alpha
 */
interface UsePersistentDeviceSettingsOptions {
  /**
   * The fallback value to use if no stored value is found.
   */
  fallbackValues?: DeviceSettings;
  /**
   * Whether to prevent saving the device settings to local storage.
   * @defaultValue false
   */
  preventSave?: boolean;
}

/**
 * A hook that provides access to persistent device settings stored in local storage.
 * @param fallbackValues - The initial value to use if no stored value is found.
 * @returns A tuple containing the stored value and a function to update the stored value.
 * @alpha
 */
export function usePersistentDeviceSettings(options: UsePersistentDeviceSettingsOptions = {}) {
  const [deviceSettings, setSettings] = React.useState<DeviceSettings>(
    getDeviceSettings(options.fallbackValues),
  );

  const saveAudioInputEnabled = React.useCallback((isEnabled: boolean) => {
    setSettings((prev) => ({ ...prev, audioInputEnabled: isEnabled }));
  }, []);
  const saveVideoInputEnabled = React.useCallback((isEnabled: boolean) => {
    setSettings((prev) => ({ ...prev, videoInputEnabled: isEnabled }));
  }, []);
  const saveAudioInputDeviceId = React.useCallback((deviceId: string) => {
    setSettings((prev) => ({ ...prev, audioInputDeviceId: deviceId }));
  }, []);
  const saveVideoInputDeviceId = React.useCallback((deviceId: string) => {
    setSettings((prev) => ({ ...prev, videoInputDeviceId: deviceId }));
  }, []);

  React.useEffect(() => {
    if (options.preventSave === true) {
      return;
    }
    setDeviceSettings(deviceSettings);
  }, [deviceSettings, options.preventSave]);

  return {
    deviceSettings,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  };
}
