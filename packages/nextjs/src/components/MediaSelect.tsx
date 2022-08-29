import { Room } from 'livekit-client';
import React, { ChangeEventHandler, useEffect, useState } from 'react';
import { useMaybeRoomContext } from './LiveKitRoom';

type MediaSelectProps = React.HTMLAttributes<HTMLSelectElement> & {
  kind: MediaDeviceKind;
  onChange?: (devices: MediaDeviceInfo[]) => void;
};

export const useMediaSelect = (
  kind: MediaDeviceKind,
  onDevicesChange?: (devices: MediaDeviceInfo[]) => void,
  onDeviceSelect?: (deviceId: string) => void,
) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const room = useMaybeRoomContext();

  const onChange: ChangeEventHandler<HTMLSelectElement> = async (evt) => {
    await room?.switchActiveDevice(kind, evt.target.value);
    if (onDeviceSelect) {
      onDeviceSelect(evt.target.value);
    }
  };

  useEffect(() => {
    Room.getLocalDevices(kind).then((newDevices) => setDevices(newDevices));
    const listener = async () => {
      const newDevices = await Room.getLocalDevices(kind);
      setDevices(newDevices);
      if (onDevicesChange) {
        onDevicesChange(devices);
      }
    };
    navigator.mediaDevices.addEventListener('devicechange', listener);
    return () => navigator.mediaDevices.removeEventListener('devicechange', listener);
  });

  return { devices, onChange };
};

export const MediaSelect = ({ kind }: MediaSelectProps) => {
  const { devices, onChange } = useMediaSelect(kind);

  return (
    <select onChange={onChange}>
      {devices.map((d) => (
        <option value={d.deviceId} key={d.deviceId}>
          {d.label}
        </option>
      ))}
    </select>
  );
};
