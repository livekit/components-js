import { Room } from 'livekit-client';
import { getCSSClassName } from '../utils';

export function setupDeviceSelect() {
  const deviceListener = (
    kind: MediaDeviceKind,
    onDevicesChange?: (devices: MediaDeviceInfo[]) => void,
  ) => {
    Room.getLocalDevices(kind).then((newDevices) => onDevicesChange?.(newDevices));
    const listener = async () => {
      const newDevices = await Room.getLocalDevices(kind);
      onDevicesChange?.(newDevices);
    };
    navigator.mediaDevices.addEventListener('devicechange', listener);
    return () => navigator.mediaDevices.removeEventListener('devicechange', listener);
  };
  return { className: getCSSClassName('device-select'), deviceListener };
}

export function setupDeviceMenu() {
  const deviceListener = (
    kind: MediaDeviceKind,
    onDevicesChange?: (devices: MediaDeviceInfo[], listElement: HTMLUListElement) => void,
    room?: Room,
  ) => {
    Room.getLocalDevices(kind).then((newDevices) => {
      const ul = constructList(newDevices, kind, room);
      onDevicesChange?.(newDevices, ul);
    });
    const listener = async () => {
      const newDevices = await Room.getLocalDevices(kind);
      const ul = constructList(newDevices, kind, room);
      onDevicesChange?.(newDevices, ul);
    };
    navigator.mediaDevices.addEventListener('devicechange', listener);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', listener);
    };
  };

  return { className: getCSSClassName('device-select'), deviceListener };
}

function constructList(devices: MediaDeviceInfo[], kind: MediaDeviceKind, room?: Room) {
  const ul = document.createElement('ul');
  ul.className = 'lk-device-list';
  devices.forEach((device) => {
    const li = document.createElement('li');
    // @ts-ignore
    li.value = device.deviceId;
    li.innerText = device.label;
    li.className = 'lk-device-list-item';
    li.addEventListener('click', () => {
      room?.switchActiveDevice(kind, device.deviceId);
      // onClose?.();
    });
    ul.append(li);
  });
  return ul;
}
