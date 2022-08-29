import { Room } from 'livekit-client';

export function deviceSelect(
  kind: MediaDeviceKind,
  onDevicesChange?: (devices: MediaDeviceInfo[]) => void,
) {
  Room.getLocalDevices(kind).then((newDevices) => onDevicesChange?.(newDevices));
  const listener = async () => {
    const newDevices = await Room.getLocalDevices(kind);
    onDevicesChange?.(newDevices);
  };
  navigator.mediaDevices.addEventListener('devicechange', listener);
  return () => navigator.mediaDevices.removeEventListener('devicechange', listener);
}
