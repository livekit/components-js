import React, { ChangeEventHandler, useEffect, useState } from 'react';
import { useMaybeRoomContext } from './LiveKitRoom';
import { deviceSelect } from '@livekit/auth-helpers-shared';

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
  // TODO figure out and return initial/current device

  const handleDevicesChanged = (newDevices: MediaDeviceInfo[]) => {
    setDevices(newDevices);
    onDevicesChange?.(newDevices);
  };

  useEffect(() => deviceSelect(kind, handleDevicesChanged));

  return { devices, onChange };
};

export const MediaSelect = ({ kind, onChange: _, ...rest }: MediaSelectProps) => {
  const { devices, onChange } = useMediaSelect(kind);

  return (
    <select onChange={onChange} {...rest}>
      {devices.map((d) => (
        <option value={d.deviceId} key={d.deviceId}>
          {d.label}
        </option>
      ))}
    </select>
  );
};
