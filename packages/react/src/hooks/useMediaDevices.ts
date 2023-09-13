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
export function useMediaDevices({ kind }: { kind: MediaDeviceKind }) {
  const deviceObserver = React.useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  return devices;
}
