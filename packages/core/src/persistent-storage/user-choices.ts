import { cssPrefix } from '../constants';
import { getLocalStorageObject, setLocalStorageObject } from './local-storage-helpers';

const USER_CHOICES_KEY = `${cssPrefix}-device-settings` as const;

export type UserChoices = {
  videoInputEnabled: boolean;
  audioInputEnabled: boolean;
  videoInputDeviceId: string;
  audioInputDeviceId: string;
  username: string;
};

const defaultUserChoices: UserChoices = {
  videoInputEnabled: true,
  audioInputEnabled: true,
  videoInputDeviceId: '',
  audioInputDeviceId: '',
  username: '',
};

/**
 * Saves user choices to local storage.
 * @param deviceSettings - The device settings to be stored.
 * @alpha
 */
export function saveUserChoices(deviceSettings: UserChoices): void {
  setLocalStorageObject(USER_CHOICES_KEY, deviceSettings);
}

/**
 * Reads the user choices from local storage, or returns the default settings if none are found.
 * @param defaults - The default device settings to use if none are found in local storage.
 * @defaultValue `defaultUserChoices`
 *
 * @alpha
 */
export function loadUserChoices(defaults?: Partial<UserChoices>): UserChoices {
  const fallback: UserChoices = {
    videoInputEnabled: defaults?.videoInputEnabled ?? defaultUserChoices.videoInputEnabled,
    audioInputEnabled: defaults?.audioInputEnabled ?? defaultUserChoices.audioInputEnabled,
    videoInputDeviceId: defaults?.videoInputDeviceId ?? defaultUserChoices.videoInputDeviceId,
    audioInputDeviceId: defaults?.audioInputDeviceId ?? defaultUserChoices.audioInputDeviceId,
    username: defaults?.username ?? defaultUserChoices.username,
  };

  return getLocalStorageObject(USER_CHOICES_KEY) ?? fallback;
}
