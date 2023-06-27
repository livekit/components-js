import type { Room } from 'livekit-client';
import { useMaybeRoomContext } from '../context';
import React from 'react';
import { createMediaDeviceObserver, setupDeviceSelector } from '@livekit/components-core';
import { useObservableState } from './internal';

import type { PermittedDevices } from 'livekit-client/dist/src/room/DeviceManager';

export type MediaDevices = {
  available: MediaDeviceInfo[];
  selectedId: string;
  setSelected: (deviceId: string) => Promise<void>;
};

export type MediaDevicesSelection = {
  audioIn?: MediaDevices;
  audioOut?: MediaDevices;
  videoIn?: MediaDevices;
  classNames: { audio?: string; video?: string; audioOut?: string };
  permittedDevices: PermittedDevices;
};

export type MediaAllDevicesSelectProps = {
  room?: Room;
  // A string with the deviceId.
  audio: string;
  video: string;
  audioOut: string;
};

export function useMediaAllDevicesSelect({
  room,
  audio,
  video,
  audioOut,
}: MediaAllDevicesSelectProps): MediaDevicesSelection {
  const roomContext = useMaybeRoomContext();
  // List of all devices.
  const deviceObserver = React.useMemo(
    () =>
      createMediaDeviceObserver(undefined, {
        audio: { deviceId: audio },
        video: { deviceId: video },
      }),
    [audio, video],
  );
  const [devices, permittedDevices] = useObservableState(deviceObserver, [[], {}]);

  // Active device management.
  const [currentAudioId, setcurrentAudioId] = React.useState<string>('');
  const [currentVideoId, setcurrentVideoId] = React.useState<string>('');
  const [currentAudioOutId, setcurrentAudioOutId] = React.useState<string>(audioOut);

  const {
    className: audioClassName,
    activeDeviceObservable: activeAudioObservable,
    setActiveMediaDevice: setActiveAudioDevice,
  } = React.useMemo(
    () => setupDeviceSelector('audioinput', room ?? roomContext),
    [room, roomContext],
  );
  const {
    className: videoClassName,
    activeDeviceObservable: activeVideoObservable,
    setActiveMediaDevice: setActiveVideoDevice,
  } = React.useMemo(
    () => setupDeviceSelector('videoinput', room ?? roomContext),
    [room, roomContext],
  );
  const {
    className: audioOutClassName,
    activeDeviceObservable: activeAudioOutObservable,
    setActiveMediaDevice: setActiveAudioOutDevice,
  } = React.useMemo(
    () => setupDeviceSelector('audiooutput', room ?? roomContext),
    [room, roomContext],
  );

  React.useEffect(() => {
    const listenerAudio = activeAudioObservable.subscribe((deviceId) => {
      if (deviceId) setcurrentAudioId(deviceId);
    });
    return () => {
      listenerAudio?.unsubscribe();
    };
  }, [activeAudioObservable]);
  React.useEffect(() => {
    const listenerVideo = activeVideoObservable.subscribe((deviceId) => {
      if (deviceId) setcurrentVideoId(deviceId);
    });
    return () => {
      listenerVideo?.unsubscribe();
    };
  }, [activeVideoObservable]);
  React.useEffect(() => {
    const listenerAudioOut = activeAudioOutObservable.subscribe((deviceId) => {
      if (deviceId) setcurrentAudioOutId(deviceId);
    });
    return () => {
      listenerAudioOut?.unsubscribe();
    };
  }, [activeAudioOutObservable]);

  // Update the selected/active device to the one for which the user granted permission.
  React.useEffect(() => {
    if (permittedDevices.audioDeviceId) {
      setActiveAudioDevice(permittedDevices.audioDeviceId);
    }
    if (permittedDevices.videoDeviceId) {
      setActiveVideoDevice(permittedDevices.videoDeviceId);
    }
  }, [permittedDevices, setActiveAudioDevice, setActiveVideoDevice]);

  return {
    audioIn: {
      available: devices.filter((d) => d.kind == 'audioinput'),
      selectedId: currentAudioId,
      setSelected: setActiveAudioDevice,
    },
    audioOut: {
      available: devices.filter((d) => d.kind == 'audiooutput'),
      selectedId: currentAudioOutId,
      setSelected: setActiveAudioOutDevice,
    },
    videoIn: {
      available: devices.filter((d) => d.kind == 'videoinput'),
      selectedId: currentVideoId,
      setSelected: setActiveVideoDevice,
    },
    classNames: {
      audio: audioClassName,
      video: videoClassName,
      audioOut: audioOutClassName,
    },
    permittedDevices,
  };
}

export interface UseMediaDeviceSelectProps {
  kind: MediaDeviceKind;
  room?: Room;
}

export function useMediaDeviceSelect({ kind, room }: UseMediaDeviceSelectProps) {
  const roomContext = useMaybeRoomContext();

  // List of all devices.
  const deviceObserver = React.useMemo(() => createMediaDeviceObserver(undefined), [kind]);
  const [devices, permittedDevices] = useObservableState(deviceObserver, [[], {}]);

  // Active device management.
  const [currentDeviceId, setCurrentDeviceId] = React.useState<string>(
    kind == 'audioinput'
      ? permittedDevices.audioDeviceId ?? ''
      : permittedDevices.videoDeviceId ?? '',
  );
  const { className, activeDeviceObservable, setActiveMediaDevice } = React.useMemo(
    () => setupDeviceSelector(kind, room ?? roomContext),
    [kind, room, roomContext],
  );

  React.useEffect(() => {
    const listener = activeDeviceObservable.subscribe((deviceId) => {
      if (deviceId) setCurrentDeviceId(deviceId);
    });
    return () => {
      listener?.unsubscribe();
    };
  }, [activeDeviceObservable]);

  return { devices, className, activeDeviceId: currentDeviceId, setActiveMediaDevice };
}

export function useMediaDevices({ kind }: { kind?: MediaDeviceKind }, requestPermissions = true) {
  const deviceObserver = React.useMemo(
    () =>
      createMediaDeviceObserver(kind, {
        video: kind == 'videoinput' && requestPermissions,
        audio: kind == 'audioinput' && requestPermissions,
      }),
    [kind, requestPermissions],
  );
  const devices = useObservableState(deviceObserver, [[], {}]);
  return devices;
}
