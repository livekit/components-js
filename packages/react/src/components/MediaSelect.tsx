import React, {
  ChangeEventHandler,
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMaybeRoomContext } from './LiveKitRoom';
import { setupMediaSelect } from '@livekit/components-core';
import { mergeProps } from 'react-aria';

type DeviceMenuProps = React.HTMLAttributes<HTMLElement> & {
  kind: MediaDeviceKind;
  onChange?: ChangeEventHandler<HTMLSelectElement | HTMLUListElement>;
  onDevicesChange?: (devices: MediaDeviceInfo[]) => void;
};

export const useMediaDevices = (
  kind: MediaDeviceKind,
  onChange?: ChangeEventHandler<HTMLElement>,
  onDevicesChange?: (devices: MediaDeviceInfo[]) => void,
) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const room = useMaybeRoomContext();

  // TODO figure out and return initial/current device

  const onChangeHandler: ChangeEventHandler<HTMLSelectElement> = useCallback(async (evt) => {
    await room?.switchActiveDevice(kind, evt.target.value);
    if (onChange) {
      onChange(evt);
    }
  }, []);

  const handleDevicesChanged = useCallback(
    (newDevices: MediaDeviceInfo[]) => {
      setDevices(newDevices);
      onDevicesChange?.(newDevices);
    },
    [onDevicesChange],
  );

  const { deviceListener } = useMemo(() => {
    const { deviceListener } = setupMediaSelect();
    return { deviceListener };
  }, []);

  useEffect(() => deviceListener(kind, handleDevicesChanged));

  return { devices, onChangeHandler };
};

export const MediaSelect = (props: DeviceMenuProps) => {
  const { devices, onChangeHandler } = useMediaDevices(
    props.kind,
    props.onChange,
    props.onDevicesChange,
  );

  return (
    <select onChange={onChangeHandler}>
      {devices.map((d) => (
        <option value={d.deviceId} key={d.deviceId}>
          {d.label}
        </option>
      ))}
    </select>
  );
};

export function DeviceMenu(props: DeviceMenuProps) {
  const ref = React.useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const clickHandler = () => {
    setIsOpen(!isOpen);
  };
  const mergedProps = mergeProps(props, { onClick: clickHandler });
  const { devices, onChangeHandler } = useMediaDevices(
    props.kind,
    props.onChange,
    props.onDevicesChange,
  );

  return (
    <div className="lk-menu-container" style={{ position: 'relative' }}>
      <button {...mergedProps} ref={ref}>
        {props['aria-label']}
        <span aria-hidden="true" style={{ paddingLeft: 5 }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <ul
          className="lk-device-list"
          style={{ position: 'absolute', top: 0, right: 0, transform: 'translate(0, -100%)' }}
        >
          {devices.map((d) => (
            <li
              onClick={() => {
                onChangeHandler({
                  target: { value: d.deviceId },
                } as React.ChangeEvent<HTMLSelectElement>);
                setIsOpen(false);
              }}
            >
              {d.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
