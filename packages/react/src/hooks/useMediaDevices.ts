import * as React from 'react';
import { useObservableState } from './internal';
import { createMediaDeviceObserver } from '@livekit/components-core';

/** @public */
export function useMediaDevices({ kind }: { kind: MediaDeviceKind }) {
  const deviceObserver = React.useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  return devices;
}
