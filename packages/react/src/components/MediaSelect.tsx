import React, {
  ChangeEventHandler,
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMaybeRoomContext } from '../contexts';
import { setupDeviceMenu, setupDeviceSelect } from '@livekit/components-core';
import { mergeProps } from 'react-aria';

type DeviceMenuProps = React.HTMLAttributes<HTMLElement> & {
  kind: MediaDeviceKind;
  onChange?: (device: MediaDeviceInfo) => void;
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
    const { deviceListener } = setupDeviceSelect();
    return { deviceListener };
  }, []);

  useEffect(() => deviceListener(kind, handleDevicesChanged));

  return { devices, onChangeHandler };
};

export const useDeviceMenu = (
  kind: MediaDeviceKind,
  menuContainer: RefObject<HTMLElement>,
  onChange?: (info: MediaDeviceInfo) => void,
  onDevicesChange?: (devices: MediaDeviceInfo[]) => void,
) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const room = useMaybeRoomContext();
  const { deviceListener } = useMemo(() => setupDeviceMenu(), []);
  const changeHandler = (newDevices: MediaDeviceInfo[], listElement: HTMLUListElement) => {
    setDevices(newDevices);
    onDevicesChange?.(newDevices);
    menuContainer.current?.replaceChildren(listElement);
  };
  useEffect(() => {
    const unsubscribe = deviceListener(kind, onChange, changeHandler, room);

    return () => unsubscribe();
  }, [kind, room, menuContainer]);

  return { devices };
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listContainerRef = React.useRef<HTMLDivElement>(null);

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const clickHandler = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const onClose = (evt: MouseEvent) => {
      if (evt.target !== buttonRef.current) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', onClose);

    return () => {
      document.removeEventListener('click', onClose);
    };
  });

  useDeviceMenu(props.kind, listContainerRef, props.onChange, props.onDevicesChange);
  const mergedProps = mergeProps(props, { onClick: clickHandler });

  return (
    <div ref={containerRef} className="lk-menu-container" style={{ position: 'relative' }}>
      <button {...mergedProps} ref={buttonRef}>
        ▼
      </button>
      <div style={{ display: isOpen ? 'block' : 'none' }} ref={listContainerRef} />
    </div>
  );
}
