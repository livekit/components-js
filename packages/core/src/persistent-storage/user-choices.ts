import { cssPrefix } from '../constants';
import { loadFromLocalStorage, saveToLocalStorage } from './local-storage-helpers';

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
  videoEnabled: boolean;
  /**
   * Whether audio input is enabled.
   * @defaultValue `true`
   */
  audioEnabled: boolean;
  /**
   * The device ID of the video input device to use.
   * @defaultValue `''`
   */
  videoDeviceId: string;
  /**
   * The device ID of the audio input device to use.
   * @defaultValue `''`
   */
  audioDeviceId: string;
  /**
   * The username to use.
   * @defaultValue `''`
   */
  username: string;
};

export type LocalUserChoices = UserChoices & {
  /** @deprecated This property will be removed without replacement. */
  e2ee: boolean;
  /** @deprecated This property will be removed without replacement. */
  sharedPassphrase: string;
};

const defaultUserChoices: UserChoices = {
  videoEnabled: true,
  audioEnabled: true,
  videoDeviceId: '',
  audioDeviceId: '',
  username: '',
} as const;

/**
 * Saves user choices to local storage.
 * @param userChoices - The device settings to be stored.
 * @alpha
 */
export function saveUserChoices(
  userChoices: UserChoices,
  /**
   * Whether to prevent saving user choices to local storage.
   */
  preventSave: boolean = false,
): void {
  if (preventSave === true) {
    return;
  }
  saveToLocalStorage(USER_CHOICES_KEY, userChoices);
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
    videoEnabled: defaults?.videoEnabled ?? defaultUserChoices.videoEnabled,
    audioEnabled: defaults?.audioEnabled ?? defaultUserChoices.audioEnabled,
    videoDeviceId: defaults?.videoDeviceId ?? defaultUserChoices.videoDeviceId,
    audioDeviceId: defaults?.audioDeviceId ?? defaultUserChoices.audioDeviceId,
    username: defaults?.username ?? defaultUserChoices.username,
  };

  if (preventLoad) {
    return fallback;
  } else {
    return loadFromLocalStorage(USER_CHOICES_KEY) ?? fallback;
  }
}
