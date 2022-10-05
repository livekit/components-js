import React, { Attributes, HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { useRoomContext } from '../../contexts';
import { setupDeviceSelector, createMediaDeviceObserver } from '@livekit/components-core';
import { mergeProps, useObservableState } from '../../utils';
import { Room } from 'livekit-client';

export const useDeviceSelector = (
  kind: MediaDeviceKind,
  room: Room,
  props: HTMLAttributes<HTMLDivElement>,
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

interface DeviceSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  kind: MediaDeviceKind;
}

export function DeviceSelector({ kind, ...props }: DeviceSelectorProps) {
  const room = useRoomContext();
  const { devices, activeDevice, setActiveMediaDevice, mergedProps } = useDeviceSelector(
    kind,
    room,
    props,
  );

  const headingStyle = { textDecoration: 'underline', fontWeight: 'bold' };
  const activeStyle = { color: 'red' };
  return (
    <ul {...mergedProps}>
      <ul>
        <li style={headingStyle}>
          {kind === 'audioinput'
            ? 'Audio Input'
            : kind === 'videoinput'
            ? 'Video Input'
            : 'Audio Output'}
        </li>
        {devices.map((device) => (
          <li key={device.deviceId} id={device.deviceId}>
            <button
              style={device.deviceId === activeDevice ? activeStyle : {}}
              onClick={() => setActiveMediaDevice(device.kind, device.deviceId)}
            >
              {device.label}
            </button>
          </li>
        ))}
      </ul>
    </ul>
  );
}
