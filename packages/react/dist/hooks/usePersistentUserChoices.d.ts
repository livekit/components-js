import { LocalUserChoices } from '@livekit/components-core';
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
export declare function usePersistentUserChoices(options?: UsePersistentUserChoicesOptions): {
    userChoices: LocalUserChoices;
    saveAudioInputEnabled: (isEnabled: boolean) => void;
    saveVideoInputEnabled: (isEnabled: boolean) => void;
    saveAudioInputDeviceId: (deviceId: string) => void;
    saveVideoInputDeviceId: (deviceId: string) => void;
    saveUsername: (username: string) => void;
};
//# sourceMappingURL=usePersistentUserChoices.d.ts.map