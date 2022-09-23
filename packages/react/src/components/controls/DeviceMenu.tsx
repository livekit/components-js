import React, { RefObject, useEffect, useMemo, useState } from 'react';
import { useMaybeRoomContext } from '../../contexts';
import { setupDeviceMenu, createMediaDeviceObserver } from '@livekit/components-core';
import { mergeProps } from 'react-aria';
import { Subscription } from 'rxjs';

type DeviceMenuProps = React.HTMLAttributes<HTMLElement> & {
  kind: MediaDeviceKind;
  onActiveDeviceChange?: (device: MediaDeviceInfo) => void;
  onDevicesChange?: (devices: MediaDeviceInfo[]) => void;
};

export const useMediaDevices = (kind: MediaDeviceKind) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const subscriber = createMediaDeviceObserver(kind).subscribe(setDevices);
    return () => subscriber.unsubscribe();
  }, [kind]);

  return { devices };
};

export const useDeviceMenu = (kind: MediaDeviceKind, menuContainer?: RefObject<HTMLElement>) => {
  const room = useMaybeRoomContext();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDevice, setActiveDevice] = useState<MediaDeviceInfo | undefined>(undefined);
  const { devicesObservable, listElementObservable, activeDeviceObservable } = useMemo(
    () => setupDeviceMenu(kind, room),
    [],
  );
  const updateElement = (listElement: HTMLUListElement) => {
    menuContainer?.current?.replaceChildren(listElement);
  };
  useEffect(() => {
    const subscriptions: Array<Subscription> = [];
    subscriptions.push(devicesObservable.subscribe(setDevices));
    subscriptions.push(activeDeviceObservable.subscribe(setActiveDevice));
    subscriptions.push(listElementObservable.subscribe(updateElement));

    return () => subscriptions.forEach((sub) => sub.unsubscribe());
  }, [kind, room, menuContainer]);

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
