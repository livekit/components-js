import { cssPrefix } from '../constants';
import { createLocalStorageInterface } from './local-storage-helpers';

const USER_CHOICES_KEY = `${cssPrefix}-user-choices` as const;

/**
 * @public
 * Represents the user's choices for video and audio input devices,
 * as well as their username.
 */
export type LocalUserChoices = {
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

export const defaultUserChoices: LocalUserChoices = {
  videoEnabled: true,
  audioEnabled: true,
  videoDeviceId: 'default',
  audioDeviceId: 'default',
  username: '',
} as const;

/**
 * The type of the object stored in local storage.
 * @remarks
 * TODO: Replace this type with `LocalUserChoices` after removing the deprecated properties from `LocalUserChoices`.
 * @internal
 */
type TempStorageType = Omit<LocalUserChoices, 'e2ee' | 'sharedPassphrase'>;
const { load, save } = createLocalStorageInterface<TempStorageType>(USER_CHOICES_KEY);

/**
 * Saves user choices to local storage.
 * @alpha
 */
export function saveUserChoices(
  userChoices: LocalUserChoices,
  /**
   * Whether to prevent saving user choices to local storage.
   */
  preventSave: boolean = false,
): void {
  if (preventSave === true) {
    return;
  }
  save(userChoices);
}

/**
 * Reads the user choices from local storage, or returns the default settings if none are found.
 * @remarks
 * The deprecated parameters `e2ee` and `sharedPassphrase` are not read from local storage
 * and always return the value from the passed `defaults` or internal defaults.
 * @alpha
 */
export function loadUserChoices(
  defaults?: Partial<LocalUserChoices>,
  /**
   * Whether to prevent loading from local storage and return default values instead.
   * @defaultValue false
   */
  preventLoad: boolean = false,
): LocalUserChoices {
  const fallback: LocalUserChoices = {
    videoEnabled: defaults?.videoEnabled ?? defaultUserChoices.videoEnabled,
    audioEnabled: defaults?.audioEnabled ?? defaultUserChoices.audioEnabled,
    videoDeviceId: defaults?.videoDeviceId ?? defaultUserChoices.videoDeviceId,
    audioDeviceId: defaults?.audioDeviceId ?? defaultUserChoices.audioDeviceId,
    username: defaults?.username ?? defaultUserChoices.username,
  };

  if (preventLoad) {
    return fallback;
  } else {
    const maybeLoadedObject = load();
    const result = { ...fallback, ...(maybeLoadedObject ?? {}) };
    return result;
  }
}
