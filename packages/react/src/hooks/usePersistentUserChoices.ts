import type { UserChoices } from '@livekit/components-core';
import { loadUserChoices, saveUserChoices } from '@livekit/components-core';
import * as React from 'react';

/**
 * Options for the `usePersistentDeviceSettings` hook.
 * @alpha
 */
export interface UsePersistentUserChoicesOptions {
  /**
   * The default value to use if reading from local storage returns no results or fails.
   */
  defaults?: Partial<UserChoices>;
  /**
   * Whether to prevent saving to persistent storage.
   * @defaultValue false
   */
  preventSave?: boolean;
  /**
   * Whether to prevent loading user choices from persistent storage and use `defaults` instead.
   * @defaultValue false
   */
  preventLoad?: boolean;
}

/**
 * A hook that provides access to user choices stored in local storage, such as
 * selected media devices and their current state (on or off), as well as the user name.
 * @alpha
 */
export function usePersistentUserChoices(options: UsePersistentUserChoicesOptions = {}) {
  const [userChoices, setSettings] = React.useState<UserChoices>(
    loadUserChoices(options.defaults, options.preventLoad ?? false),
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
    saveUserChoices(userChoices, options.preventSave ?? false);
  }, [userChoices, options.preventSave]);

  return {
    userChoices,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  };
}
