'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { useMediaDeviceSelect, useMaybeRoomContext } from '@livekit/components-react';
import { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
type DeviceSelectProps = React.ComponentProps<typeof Select> & {
  kind: MediaDeviceKind;
  track?: LocalAudioTrack | LocalVideoTrack | undefined;
  requestPermissions?: boolean;
  onError?: (error: Error) => void;
  initialSelection?: string;
  onActiveDeviceChange?: (deviceId: string) => void;
  onDeviceListChange?: (devices: MediaDeviceInfo[]) => void;
};

export function DeviceSelect({
  kind,
  track,
  requestPermissions,
  onError,
  initialSelection,
  onActiveDeviceChange,
  onDeviceListChange,
  ...props
}: DeviceSelectProps) {
  const room = useMaybeRoomContext();
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind,
    room,
    track,
    requestPermissions,
    onError,
  });
  return (
    <Select {...props} value={activeDeviceId} onValueChange={setActiveMediaDevice}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={`Select a ${kind}`} />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device) => (
          <SelectItem key={device.deviceId} value={device.deviceId}>
            {device.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
