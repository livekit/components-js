import { Room } from 'livekit-client';
import { getCSSClassName } from '../utils';

export function setupMediaSelect() {
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
