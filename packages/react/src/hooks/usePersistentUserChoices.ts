import type { UserChoices } from '@livekit/components-core';
import { loadUserChoices, saveUserChoices } from '@livekit/components-core';
import * as React from 'react';

/**
 * Options for the `usePersistentDeviceSettings` hook.
 * @alpha
 */
interface UsePersistentUserChoicesOptions {
  /**
   * The default value to use if reading from local storage returns no results or fails.
   */
  defaults?: UserChoices;
  /**
   * Whether to prevent saving the device settings to local storage.
   * @defaultValue false
   */
  preventSave?: boolean;
}

/**
 * A hook that provides access to user choices stored in local storage, such as
 * selected media devices and their current state (on or off), as well as the user name.
 * @alpha
 */
export function usePersistentUserChoices(options: UsePersistentUserChoicesOptions = {}) {
  const [deviceSettings, setSettings] = React.useState<UserChoices>(
    loadUserChoices(options.defaults),
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
    saveUserChoices(deviceSettings);
  }, [deviceSettings, options.preventSave]);

  return {
    deviceSettings,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  };
}
