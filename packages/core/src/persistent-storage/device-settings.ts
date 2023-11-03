import { cssPrefix } from '../constants';
import { getLocalStorageObject, setLocalStorageObject } from './local-storage-helpers';

const DEVICE_SELECTION_KEY = `${cssPrefix}-device-settings` as const;

export type DeviceSettings = {
  videoInputEnabled: boolean;
  audioInputEnabled: boolean;
  videoInputDeviceId: string;
  audioInputDeviceId: string;
};

const defaultDeviceSettings: DeviceSettings = {
  videoInputEnabled: true,
  audioInputEnabled: true,
  videoInputDeviceId: '',
  audioInputDeviceId: '',
};

/**
 * Sets the device settings in local storage.
 * @param deviceSettings - The device settings to be stored.
 * @alpha
 */
export function setDeviceSettings(deviceSettings: DeviceSettings): void {
  setLocalStorageObject(DEVICE_SELECTION_KEY, deviceSettings);
}

/**
 * Retrieves the device settings from local storage, or returns the default settings if none are found.
 * @param fallback - The default device settings to use if none are found in local storage.
 * @returns The retrieved device settings, or the default settings if none are found.
 * @alpha
 */
export function getDeviceSettings(fallback?: DeviceSettings): DeviceSettings {
  return getLocalStorageObject(DEVICE_SELECTION_KEY) ?? fallback ?? defaultDeviceSettings;
}
