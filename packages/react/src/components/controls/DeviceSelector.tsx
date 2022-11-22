import * as React from 'react';
import { useMaybeRoomContext } from '../../contexts';
import { setupDeviceSelector, createMediaDeviceObserver } from '@livekit/components-core';
import { mergeProps, useObservableState } from '../../utils';
import { Room } from 'livekit-client';

export const useMediaDevices = (kind: MediaDeviceKind) => {
  const deviceObserver = React.useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  return devices;
};

export const useDeviceSelector = (kind: MediaDeviceKind, room?: Room) => {
  // List of all devices.
  const deviceObserver = React.useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  // Active device management.
  const [currentDeviceId, setCurrentDeviceId] = React.useState<string>('');
  const { className, activeDeviceObservable, setActiveMediaDevice } = React.useMemo(
    () => setupDeviceSelector(kind, room),
    [kind, room],
  );

  React.useEffect(() => {
    const listener = activeDeviceObservable.subscribe((deviceId) => {
      if (deviceId) setCurrentDeviceId(deviceId);
    });
    return () => {
      listener?.unsubscribe();
    };
  }, [activeDeviceObservable]);

  return { devices, className, activeDeviceId: currentDeviceId, setActiveMediaDevice };
};

export interface DeviceSelectorProps extends React.HTMLAttributes<HTMLUListElement> {
  kind: MediaDeviceKind;
  onActiveDeviceChange?: (deviceId: string) => void;
}

/**
 * The DeviceSelector list all media devices of one kind.
 * Clicking on one of the listed devices make it the active media device.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <DeviceSelector kind='audioinput' />
 * </LiveKitRoom>
 * ```
 */
export function DeviceSelector({ kind, onActiveDeviceChange, ...props }: DeviceSelectorProps) {
  const room = useMaybeRoomContext();
  const { devices, activeDeviceId, setActiveMediaDevice, className } = useDeviceSelector(
    kind,
    room,
  );

  const handleActiveDeviceChange = async (kind: MediaDeviceKind, deviceId: string) => {
    setActiveMediaDevice(kind, deviceId);
    onActiveDeviceChange?.(deviceId);
  };
  // Merge Props
  const mergedProps = React.useMemo(() => mergeProps(props, { className }), [className, props]);

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

interface DeviceSelectButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  kind?: MediaDeviceKind;
  onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
}

/**
 * The DeviceSelectButton prefab component is a button that opens a menu that lists
 * all media devices and allows the user to select them.
 *
 * @remarks
 * This component is implemented with the `DeviceSelector` LiveKit components.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <DeviceSelectButton />
 * </LiveKitRoom>
 * ```
 */
export const DeviceSelectButton = ({
  kind,
  onActiveDeviceChange,
  ...props
}: DeviceSelectButtonProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleActiveDeviceChange = (kind: MediaDeviceKind, deviceId: string) => {
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };
  return (
    <span style={{ position: 'relative', flexShrink: 0 }}>
      <button
        className="lk-button lk-button-menu"
        aria-pressed={isOpen}
        {...props}
        onClick={() => setIsOpen(!isOpen)}
      >
        {props.children}
      </button>

      <div className="lk-device-menu"
        style={{
          display: isOpen ? 'block' : 'none',
        }}
      >
        {kind ? (
          <DeviceSelector
            onActiveDeviceChange={(deviceId) => handleActiveDeviceChange(kind, deviceId)}
            kind={kind}
          />
        ) : (
          <>
            <div className="lk-device-menu-heading">Audio inputs</div>
            <DeviceSelector
              kind="audioinput"
              onActiveDeviceChange={(deviceId) =>
                handleActiveDeviceChange('audioinput', deviceId)
              }
            ></DeviceSelector>
            <div className="lk-device-menu-heading">Video inputs</div>
            <DeviceSelector
              kind="videoinput"
              onActiveDeviceChange={(deviceId) =>
                handleActiveDeviceChange('videoinput', deviceId)
              }
            ></DeviceSelector>
          </>
        )}
      </div>
    </span>
  );
};
