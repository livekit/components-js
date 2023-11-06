import { cssPrefix } from '../constants';
import { getLocalStorageObject, setLocalStorageObject } from './local-storage-helpers';

const USER_CHOICES_KEY = `${cssPrefix}-device-settings` as const;

/**
 * Represents the user's choices for video and audio input devices,
 * as well as their username.
 */
export type UserChoices = {
  /**
   * Whether video input is enabled.
   * @defaultValue `true`
   */
  videoInputEnabled: boolean;
  /**
   * Whether audio input is enabled.
   * @defaultValue `true`
   */
  audioInputEnabled: boolean;
  /**
   * The device ID of the video input device to use.
   * @defaultValue `''`
   */
  videoInputDeviceId: string;
  /**
   * The device ID of the audio input device to use.
   * @defaultValue `''`
   */
  audioInputDeviceId: string;
  /**
   * The username to use.
   * @defaultValue `''`
   */
  username: string;
};

const defaultUserChoices: UserChoices = {
  videoInputEnabled: true,
  audioInputEnabled: true,
  videoInputDeviceId: '',
  audioInputDeviceId: '',
  username: '',
} as const;

/**
 * Saves user choices to local storage.
 * @param deviceSettings - The device settings to be stored.
 * @alpha
 */
export function saveUserChoices(
  deviceSettings: UserChoices,
  /**
   * Whether to prevent saving user choices to local storage.
   */
  preventSave: boolean = false,
): void {
  if (preventSave === true) {
    return;
  }
  setLocalStorageObject(USER_CHOICES_KEY, deviceSettings);
}

/**
 * Reads the user choices from local storage, or returns the default settings if none are found.
 * @param defaults - The default device settings to use if none are found in local storage.
 * @defaultValue `defaultUserChoices`
 *
 * @alpha
 */
export function loadUserChoices(
  defaults?: Partial<UserChoices>,
  /**
   * Whether to prevent loading from local storage and return default values instead.
   * @defaultValue false
   */
  preventLoad: boolean = false,
): UserChoices {
  const fallback: UserChoices = {
    videoInputEnabled: defaults?.videoInputEnabled ?? defaultUserChoices.videoInputEnabled,
    audioInputEnabled: defaults?.audioInputEnabled ?? defaultUserChoices.audioInputEnabled,
    videoInputDeviceId: defaults?.videoInputDeviceId ?? defaultUserChoices.videoInputDeviceId,
    audioInputDeviceId: defaults?.audioInputDeviceId ?? defaultUserChoices.audioInputDeviceId,
    username: defaults?.username ?? defaultUserChoices.username,
  };

  if (preventLoad) {
    return fallback;
  } else {
    return getLocalStorageObject(USER_CHOICES_KEY) ?? fallback;
  }
}
