import { cssPrefix } from '../constants';
import { getLocalStorageObject, setLocalStorageObject } from './local-storage-helpers';

const DEVICE_SELECTION_KEY = `${cssPrefix}-device-settings` as const;

export type DeviceSettings = {
  videoInputEnabled: boolean;
  audioInputEnabled: boolean;
  videoInputDeviceId: string;
  audioInputDeviceId: string;
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
 * Retrieves the device settings from local storage.
 * @returns The device settings object or undefined if not found.
 * @alpha
 */
export function getDeviceSettings(): DeviceSettings | undefined {
  return getLocalStorageObject(DEVICE_SELECTION_KEY);
}
