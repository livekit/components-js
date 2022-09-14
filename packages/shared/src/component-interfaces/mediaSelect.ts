import { Room, Track } from 'livekit-client';
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
  const publication = room?.localParticipant.getTrack(
    kind === 'videoinput' ? Track.Source.Camera : Track.Source.Microphone,
  );
  const activeId = publication?.track?.mediaStreamTrack.getSettings().deviceId;
  const ul = document.createElement('ul');
  ul.className = 'lk-device-list';
  devices.forEach((device) => {
    const li = document.createElement('li');
    li.id = device.deviceId;
    li.innerText = device.label;
    li.className = 'lk-device-list-item';
    if (device.deviceId === activeId) {
      li.classList.add('lk-active');
    }
    li.onclick = () => {
      console.log('switch device');
      room?.switchActiveDevice(kind, device.deviceId);
      ul.querySelectorAll(`li`)?.forEach((el) => el.classList.remove('lk-active'));
      li.classList.add('lk-active');
    };
    ul.append(li);
  });
  return ul;
}
