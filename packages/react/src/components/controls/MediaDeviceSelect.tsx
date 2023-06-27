import * as React from 'react';
import { useMaybeRoomContext } from '../../context';
import { mergeProps } from '../../utils';
import { useMediaDeviceSelect } from '../../hooks/useMediaDevices';

/** @public */
export interface MediaDeviceSelectProps extends React.HTMLAttributes<HTMLUListElement> {
  kind: MediaDeviceKind;
  onActiveDeviceChange?: (deviceId: string) => void;
  onDeviceListChange?: (devices: MediaDeviceInfo[]) => void;
  initialSelection?: string;
}

/**
 * The MediaDeviceSelect list all media devices of one kind.
 * Clicking on one of the listed devices make it the active media device.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceSelect kind='audioinput' />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function MediaDeviceSelect({
  kind,
  initialSelection,
  onActiveDeviceChange,
  onDeviceListChange,
  ...props
}: MediaDeviceSelectProps) {
  const room = useMaybeRoomContext();
  const { devices, activeDeviceId, setActiveMediaDevice, className } = useMediaDeviceSelect({
    kind,
    room,
  });
  React.useEffect(() => {
    if (initialSelection) {
      setActiveMediaDevice(initialSelection);
    }
  });

  React.useEffect(() => {
    if (typeof onDeviceListChange === 'function') {
      onDeviceListChange(devices);
    }
  }, [onDeviceListChange, devices]);

  const handleActiveDeviceChange = async (deviceId: string) => {
    setActiveMediaDevice(deviceId);
    onActiveDeviceChange?.(deviceId);
  };
  // Merge Props
  const mergedProps = React.useMemo(
    () => mergeProps(props, { className }, { className: 'lk-list' }),
    [className, props],
  );

  return (
    <ul {...mergedProps}>
      {devices.map((device) => (
        <li
          key={device.deviceId}
          id={device.deviceId}
          data-lk-active={device.deviceId === activeDeviceId}
          aria-selected={device.deviceId === activeDeviceId}
          role="option"
        >
          <button className="lk-button" onClick={() => handleActiveDeviceChange(device.deviceId)}>
            {device.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
