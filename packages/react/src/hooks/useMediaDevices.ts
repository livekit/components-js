import * as React from 'react';
import { useObservableState } from './internal';
import { createMediaDeviceObserver } from '@livekit/components-core';

/**
 * The `useMediaDevices` hook returns the list of media devices of a given kind.
 *
 * @example
 * ```tsx
 * const videoDevices = useMediaDevices({ kind: 'videoinput' });
 * const audioDevices = useMediaDevices({ kind: 'audioinput' });
 * ```
 * @public
 */
export function useMediaDevices({
  kind,
  onError,
}: {
  kind: MediaDeviceKind;
  onError?: (e: Error) => void;
}) {
  const deviceObserver = React.useMemo(
    () => createMediaDeviceObserver(kind, onError),
    [kind, onError],
  );
  const devices = useObservableState(deviceObserver, [] as MediaDeviceInfo[]);
  return devices;
}
