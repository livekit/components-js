import React, { RefObject, useEffect, useMemo, useState } from 'react';
import { useMaybeRoomContext } from '../../contexts';
import { setupDeviceMenu, createMediaDeviceObserver } from '@livekit/components-core';
import { mergeProps } from 'react-aria';
import { useObservableState } from '../../utils';

type DeviceMenuProps = React.HTMLAttributes<HTMLElement> & {
  kind: MediaDeviceKind;
  onActiveDeviceChange?: (device: MediaDeviceInfo) => void;
  onDevicesChange?: (devices: MediaDeviceInfo[]) => void;
};

export const useMediaDevices = (kind: MediaDeviceKind) => {
  const isSSR = typeof window === 'undefined';
  if (isSSR) return { devices: [] };
  const deviceObserver = useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  return { devices };
};

export const useDeviceMenu = (kind: MediaDeviceKind, menuContainer?: RefObject<HTMLElement>) => {
  const room = useMaybeRoomContext();

  const { devicesObservable, listElementObservable, activeDeviceObservable } = useMemo(
    () => setupDeviceMenu(kind, room),
    [kind, room],
  );

  const devices = useObservableState(devicesObservable, []);
  const activeDevice = useObservableState(activeDeviceObservable, undefined);
  const listElement = useObservableState(listElementObservable, undefined);
  useEffect(() => {
    if (listElement) {
      menuContainer?.current?.replaceChildren(listElement);
    }
  }, [menuContainer, listElement]);

  return { devices, activeDevice };
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

  const { devices, activeDevice } = useDeviceMenu(props.kind, listContainerRef);
  useEffect(() => {
    if (activeDevice) {
      props.onActiveDeviceChange?.(activeDevice);
    }
  }, [activeDevice, props]);
  useEffect(() => {
    props.onDevicesChange?.(devices);
  }, [devices, props]);
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
