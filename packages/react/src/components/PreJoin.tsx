import {
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  VideoPresets,
} from 'livekit-client';
import React, { useEffect, useRef, useState } from 'react';

export type LocalUserChoices = {
  username: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  videoDeviceId: string;
  audioDeviceId: string;
};

const DEFAULT_USER_CHOICES = {
  username: '',
  videoEnabled: true,
  audioEnabled: true,
  videoDeviceId: '',
  audioDeviceId: '',
};

type PreJoinProps = {
  defaults?: Partial<LocalUserChoices>;
  onValidate?: (values: LocalUserChoices) => boolean;
  onSubmit?: (values: LocalUserChoices) => void;
};

export const PreJoin = ({
  defaults = DEFAULT_USER_CHOICES,
  onValidate,
  onSubmit,
}: PreJoinProps) => {
  const [userChoices, setUserChoices] = useState(DEFAULT_USER_CHOICES);
  const [username, setUsername] = useState(defaults.username ?? DEFAULT_USER_CHOICES.username);
  const [videoEnabled, setVideoEnabled] = useState<boolean>(
    defaults.videoEnabled ?? DEFAULT_USER_CHOICES.videoEnabled,
  );
  const [audioEnabled, setAudioEnabled] = useState<boolean>(
    defaults.audioEnabled ?? DEFAULT_USER_CHOICES.audioEnabled,
  );
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<MediaDeviceInfo | undefined>(
    undefined,
  );
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<MediaDeviceInfo | undefined>(
    undefined,
  );

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const videoEl = useRef(null);
  const audioEl = useRef(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack>();
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack>();
  const [isValid, setIsValid] = useState<boolean>();

  useEffect(() => {
    updateMediaDeviceList();
    navigator.mediaDevices.ondevicechange = updateMediaDeviceList;
    return () => {
      navigator.mediaDevices.removeEventListener('ondevicechange', updateMediaDeviceList);
    };
  }, []);

  useEffect(() => {
    if (videoEnabled) {
      createLocalVideoTrack({
        deviceId: selectedVideoDevice?.deviceId,
        resolution: VideoPresets.h720.resolution,
      }).then((track) => setLocalVideoTrack(track));
    } else {
      localVideoTrack?.detach();
      setLocalVideoTrack(undefined);
    }
  }, [selectedVideoDevice, videoEnabled]);

  useEffect(() => {
    if (audioEnabled) {
      createLocalAudioTrack({
        deviceId: selectedAudioDevice?.deviceId,
      }).then((track) => setLocalAudioTrack(track));
    } else {
      localAudioTrack?.detach();
      setLocalAudioTrack(undefined);
    }
  }, [selectedAudioDevice]);

  useEffect(() => {
    if (videoEl.current) localVideoTrack?.attach(videoEl.current);
  }, [localVideoTrack, videoEl.current, selectedVideoDevice]);

  useEffect(() => {
    const newUserChoices = {
      username: username,
      videoEnabled: videoEnabled,
      audioEnabled: audioEnabled,
      videoDeviceId: selectedVideoDevice?.deviceId ?? '',
      audioDeviceId: selectedAudioDevice?.deviceId ?? '',
    };
    setUserChoices(newUserChoices);
    setIsValid(handleValidation(newUserChoices));
  }, [username, videoEnabled, audioEnabled, selectedAudioDevice, selectedVideoDevice]);

  async function updateMediaDeviceList() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    updateDropdownWhileRespectingCurrentlySelectedDevices(devices);
  }

  function updateDropdownWhileRespectingCurrentlySelectedDevices(devices: MediaDeviceInfo[]) {
    /** Video */
    const _videoDevices = devices.filter((device) => device.kind === 'videoinput');
    setVideoDevices(_videoDevices);
    if (_videoDevices) {
      const foundDevice = _videoDevices.find(
        (device) => device.deviceId === (selectedVideoDevice?.deviceId ?? defaults.videoDeviceId),
      );
      if (foundDevice) {
        setSelectedVideoDevice(foundDevice);
      } else {
        setSelectedVideoDevice(_videoDevices[0]);
      }
    }
    // /** Audio */
    const _audioDevices = devices
      .filter((device) => device.kind === 'audioinput')
      .filter((device) => device.deviceId !== 'default');
    setAudioDevices(_audioDevices);
    if (_audioDevices) {
      const foundDevice = _audioDevices.find(
        (device) => device.deviceId === (selectedAudioDevice?.deviceId ?? defaults.audioDeviceId),
      );
      if (foundDevice) {
        setSelectedAudioDevice(foundDevice);
      } else {
        setSelectedAudioDevice(_audioDevices[0]);
      }
    }
  }

  function handleJoin() {
    if (handleValidation(userChoices)) {
      if (typeof onSubmit === 'function') {
        onSubmit(userChoices);
      }
    } else {
      console.warn('Validation failed with: ', userChoices);
    }
  }

  function handleValidation(values: LocalUserChoices): boolean {
    if (typeof onValidate === 'function') {
      return onValidate(values);
    } else {
      return values.username !== '';
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {localVideoTrack ? (
        <div>
          <video ref={videoEl} style={{ width: '20rem', height: 'auto' }} />
        </div>
      ) : (
        <div style={{ width: '20rem', height: '11.25rem', backgroundColor: 'red' }}>
          Camera is off
        </div>
      )}
      {localAudioTrack ? (
        <div style={{ display: 'none' }}>
          <audio ref={audioEl} style={{ width: '20rem', height: 'auto' }} />
        </div>
      ) : (
        <></>
      )}
      <button onClick={() => setVideoEnabled(!videoEnabled)}>
        {videoEnabled ? 'Turn off camera' : 'Activate camera'}
      </button>
      <button onClick={() => setAudioEnabled(!audioEnabled)}>
        {audioEnabled ? 'Mute audio' : 'Activate audio'}
      </button>

      <select
        onChange={(value) => {
          const deviceId = value.target.value;
          setSelectedVideoDevice(videoDevices.find((d) => d.deviceId === deviceId));
        }}
        value={selectedVideoDevice?.deviceId}
      >
        {videoDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
      <select
        onChange={(value) => {
          const deviceId = value.target.value;
          setSelectedAudioDevice(audioDevices.find((d) => d.deviceId === deviceId));
        }}
        value={selectedAudioDevice?.deviceId}
      >
        {audioDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>

      <label htmlFor="username">
        Username:
        <input
          id="username"
          name="username"
          type="text"
          defaultValue={username}
          onChange={(inputEl) => setUsername(inputEl.target.value)}
        />
      </label>

      <button onClick={handleJoin} disabled={!isValid}>
        Join
      </button>

      <strong>User Choices:</strong>
      <ul style={{ overflow: 'hidden', maxWidth: '15rem' }}>
        <li>Username: {`${userChoices.username}`}</li>
        <li>Video Enabled: {`${userChoices.videoEnabled}`}</li>
        <li>Audio Enabled: {`${userChoices.audioEnabled}`}</li>
        <li>Video Device: {`${userChoices.videoDeviceId}`}</li>
        <li>Audio Device: {`${userChoices.audioDeviceId}`}</li>
      </ul>
    </div>
  );
};
