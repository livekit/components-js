import type { LocalUserChoices } from '@livekit/components-core';
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
  defaults?: Partial<LocalUserChoices>;
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
  const [userChoices, setSettings] = React.useState<LocalUserChoices>(
    loadUserChoices(options.defaults, options.preventLoad ?? false),
  );

  const saveAudioInputEnabled = React.useCallback((isEnabled: boolean) => {
    setSettings((prev) => ({ ...prev, audioEnabled: isEnabled }));
  }, []);
  const saveVideoInputEnabled = React.useCallback((isEnabled: boolean) => {
    setSettings((prev) => ({ ...prev, videoEnabled: isEnabled }));
  }, []);
  const saveAudioInputDeviceId = React.useCallback((deviceId: string) => {
    setSettings((prev) => ({ ...prev, audioDeviceId: deviceId }));
  }, []);
  const saveVideoInputDeviceId = React.useCallback((deviceId: string) => {
    setSettings((prev) => ({ ...prev, videoDeviceId: deviceId }));
  }, []);
  const saveUsername = React.useCallback((username: string) => {
    setSettings((prev) => ({ ...prev, username: username }));
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
    saveUsername,
  };
}
