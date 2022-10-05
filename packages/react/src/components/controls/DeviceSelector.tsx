import React, { HTMLAttributes, useMemo, useState } from 'react';
import { useRoomContext } from '../../contexts';
import { setupDeviceSelector, createMediaDeviceObserver } from '@livekit/components-core';
import { mergeProps, useObservableState } from '../../utils';
import { Room } from 'livekit-client';

export const useDeviceSelector = (
  kind: MediaDeviceKind,
  room: Room,
  props: HTMLAttributes<HTMLUListElement>,
) => {
  // List of all devices.
  const deviceObserver = useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  // Active device management.
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const { className, activeDeviceObservable } = useMemo(
    () => setupDeviceSelector(kind, room),
    [kind, room],
  );
  async function setActiveMediaDevice(kind: MediaDeviceKind, id: string) {
    await room?.switchActiveDevice(kind, id);
    setCurrentDeviceId(id);
  }
  const activeDevice = useObservableState(activeDeviceObservable, undefined, [currentDeviceId]);
  // Merge Props
  const mergedProps = useMemo(() => mergeProps(props, { className }), [props]);
  return { devices, mergedProps, activeDevice, setActiveMediaDevice };
};

interface DeviceSelectorProps extends React.HTMLAttributes<HTMLUListElement> {
  kind: MediaDeviceKind;
  heading?: string;
}

export function DeviceSelector({ kind, heading = '', ...props }: DeviceSelectorProps) {
  const room = useRoomContext();
  const { devices, activeDevice, setActiveMediaDevice, mergedProps } = useDeviceSelector(
    kind,
    room,
    props,
  );

  return (
    <div {...mergedProps}>
      {heading && <div>{heading}</div>}
      <ul>
        {devices.map((device) => (
          <li
            key={device.deviceId}
            id={device.deviceId}
            data-lk-active={device.deviceId === activeDevice}
          >
            <button onClick={() => setActiveMediaDevice(device.kind, device.deviceId)}>
              {device.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
