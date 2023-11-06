import { log } from '../logger';

/**
 * Set an object to local storage by key
 * @param key - the key to set the object to local storage
 * @param value - the object to set to local storage
 * @internal
 */
export function setLocalStorageObject<T extends object>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') {
    log.error('Local storage is not available.');
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    log.error(`Error setting item to local storage: ${error}`);
  }
}

/**
 * Get an object from local storage by key
 * @param key - the key to retrieve the object from local storage
 * @returns the object retrieved from local storage, or null if the key does not exist
 * @internal
 */
export function getLocalStorageObject<T extends object>(key: string): T | undefined {
  if (typeof localStorage === 'undefined') {
    log.error('Local storage is not available.');
    return undefined;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      log.warn(`Item with key ${key} does not exist in local storage.`);
      return undefined;
    }
    return JSON.parse(item);
  } catch (error) {
    log.error(`Error getting item from local storage: ${error}`);
    return undefined;
  }
}
