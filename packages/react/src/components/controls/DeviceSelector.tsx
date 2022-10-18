import React, { HTMLAttributes, useMemo, useState } from 'react';
import { useMaybeRoomContext } from '../../contexts';
import { setupDeviceSelector, createMediaDeviceObserver } from '@livekit/components-core';
import { mergeProps, useObservableState } from '../../utils';
import { Room } from 'livekit-client';
import { ToggleButton, ToggleProps } from '../uiExtensions';

export const useMediaDevices = (kind: MediaDeviceKind) => {
  const isSSR = typeof window === 'undefined';
  if (isSSR) return [];
  const deviceObserver = useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  return devices;
};

export const useDeviceSelector = (kind: MediaDeviceKind, room?: Room) => {
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
  const activeDeviceId = activeDeviceObservable
    ? useObservableState(activeDeviceObservable, undefined)
    : currentDeviceId;

  return { devices, className, activeDeviceId, setActiveMediaDevice };
};

interface DeviceSelectorProps extends React.HTMLAttributes<HTMLUListElement> {
  kind: MediaDeviceKind;
  onActiveDeviceChange?: (deviceId: string) => void;
}

export function DeviceSelector({ kind, onActiveDeviceChange, ...props }: DeviceSelectorProps) {
  const room = useMaybeRoomContext();
  const { devices, activeDeviceId, setActiveMediaDevice, className } = useDeviceSelector(
    kind,
    room,
  );

  const handleActiveDeviceChange = (kind: MediaDeviceKind, deviceId: string) => {
    setActiveMediaDevice(kind, deviceId);
    onActiveDeviceChange?.(deviceId);
  };
  // Merge Props
  const mergedProps = useMemo(() => mergeProps(props, { className }), [props]);

  return (
    <ul {...mergedProps}>
      {devices.map((device) => (
        <li
          key={device.deviceId}
          id={device.deviceId}
          data-lk-active={device.deviceId === activeDeviceId}
        >
          <button onClick={() => handleActiveDeviceChange(device.kind, device.deviceId)}>
            {device.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

interface DeviceSelectButtonProps extends ToggleProps {
  kind?: MediaDeviceKind;
  onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
}

export const DeviceSelectButton = ({
  kind,
  onActiveDeviceChange,
  ...props
}: DeviceSelectButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleActiveDeviceChange = (kind: MediaDeviceKind, deviceId: string) => {
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };
  return (
    <span style={{ position: 'relative', flexShrink: 0 }}>
      <ToggleButton
        className="lk-secondary"
        initialState={isOpen}
        {...props}
        onChange={(enabled) => setIsOpen(enabled)}
      >
        {props.children}
      </ToggleButton>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            margin: '1rem',
            bottom: '100%',
            left: '-50%',
            width: '20rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '.2rem .3rem',
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
          }}
        >
          {kind ? (
            <DeviceSelector
              onActiveDeviceChange={(deviceId) => handleActiveDeviceChange(kind, deviceId)}
              kind={kind}
            />
          ) : (
            <>
              <div>
                <div>Audio Inputs:</div>
                <DeviceSelector
                  kind="audioinput"
                  onActiveDeviceChange={(deviceId) =>
                    handleActiveDeviceChange('audioinput', deviceId)
                  }
                ></DeviceSelector>
              </div>
              <div>
                <div>Video Inputs:</div>
                <DeviceSelector
                  kind="videoinput"
                  onActiveDeviceChange={(deviceId) =>
                    handleActiveDeviceChange('videoinput', deviceId)
                  }
                ></DeviceSelector>
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
};
