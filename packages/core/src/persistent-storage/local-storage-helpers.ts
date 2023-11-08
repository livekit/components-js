import { log } from '../logger';

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * Persists a serializable object to local storage associated with the specified key.
 * @internal
 */
export function saveToLocalStorage<T extends JsonValue>(key: string, value: T): void {
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
 * Retrieves a serializable object from local storage by its key.
 * @internal
 */
export function loadFromLocalStorage<T extends JsonValue>(key: string): T | undefined {
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
