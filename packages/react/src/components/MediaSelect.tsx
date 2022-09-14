import React, {
  ChangeEventHandler,
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMaybeRoomContext } from './LiveKitRoom';
import { setupDeviceMenu, setupDeviceSelect } from '@livekit/components-core';
import { mergeProps } from 'react-aria';
import { Room } from 'livekit-client';

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
    const { deviceListener } = setupDeviceSelect();
    return { deviceListener };
  }, []);

  useEffect(() => deviceListener(kind, handleDevicesChanged));

  return { devices, onChangeHandler };
};

export const useDeviceMenu = (
  kind: MediaDeviceKind,
  onClose?: () => void,
  onDevicesChange?: (devices: MediaDeviceInfo[]) => void,
) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [listElement, setListElement] = useState<HTMLUListElement>();
  const room = useMaybeRoomContext();
  const { deviceListener } = useMemo(() => setupDeviceMenu(), []);
  const changeHandler = (newDevices: MediaDeviceInfo[], listElement: HTMLUListElement) => {
    setDevices(newDevices);
    setListElement(listElement);
    onDevicesChange?.(newDevices);
  };
  useEffect(() => {
    const unsubscribe = deviceListener(kind, changeHandler, onClose, room);

    return () => unsubscribe();
  }, [kind, room]);

  return { devices, listElement };
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
  const ref = React.useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const clickHandler = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const onClose = (evt: MouseEvent) => {
      if (evt.target !== ref.current) {
        console.log('closing', evt.target, ref.current);
        setIsOpen(false);
      }
    };
    document.addEventListener('click', onClose);

    return () => {
      document.removeEventListener('click', onClose);
    };
  });

  const { listElement } = useDeviceMenu(props.kind, () => setIsOpen(false), props.onDevicesChange);
  const mergedProps = mergeProps(props, { onClick: clickHandler });

  return (
    <div className="lk-menu-container" style={{ position: 'relative' }}>
      <button {...mergedProps} ref={ref}>
        {props['aria-label']}▼
      </button>
      {isOpen && listElement && <ul dangerouslySetInnerHTML={{ __html: listElement?.innerHTML }} />}
    </div>
  );
}
