import {
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  Track,
  VideoPresets,
} from 'livekit-client';
import * as React from 'react';
import { DeviceSelectButton, useMediaDevices } from '../components/controls/DeviceSelector';
import { MediaControlButton } from '../components/controls/MediaControlButton';

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

type PreJoinProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> & {
  /**
   * This function is called with the `LocalUserChoices` if validation is passed.
   */
  onSubmit?: (values: LocalUserChoices) => void;
  /**
   * Provide your custom validation function. Only if validation is successful the user choices are past to the onSubmit callback.
   */
  onValidate?: (values: LocalUserChoices) => boolean;
  /**
   * Prefill the input form with initial values.
   */
  defaults?: Partial<LocalUserChoices>;
  /**
   * Display a debug window for your convenience.
   */
  debug?: boolean;
};

/**
 * The PreJoin prefab component is normally presented to the user before he enters a room.
 * This component allows the user to check and select the preferred media device (camera und microphone).
 * On submit the user decisions are returned, which can then be passed on to the LiveKitRoom so that the user enters the room with the correct media devices.
 *
 * @remarks
 * This component is independent from the LiveKitRoom component and don't has to be nested inside it.
 * Because it only access the local media tracks this component is self contained and works without connection to the LiveKit server.
 *
 * @example
 * ```tsx
 * <PreJoin />
 * ```
 */
export const PreJoin = ({
  defaults = DEFAULT_USER_CHOICES,
  onValidate,
  onSubmit,
  debug,
  ...htmlProps
}: PreJoinProps) => {
  const [userChoices, setUserChoices] = React.useState(DEFAULT_USER_CHOICES);
  const [username, setUsername] = React.useState(
    defaults.username ?? DEFAULT_USER_CHOICES.username,
  );
  const [videoEnabled, setVideoEnabled] = React.useState<boolean>(
    defaults.videoEnabled ?? DEFAULT_USER_CHOICES.videoEnabled,
  );
  const [audioEnabled, setAudioEnabled] = React.useState<boolean>(
    defaults.audioEnabled ?? DEFAULT_USER_CHOICES.audioEnabled,
  );
  const [selectedVideoDevice, setSelectedVideoDevice] = React.useState<MediaDeviceInfo | undefined>(
    undefined,
  );
  const [selectedAudioDevice, setSelectedAudioDevice] = React.useState<MediaDeviceInfo | undefined>(
    undefined,
  );

  const videoDevices = useMediaDevices('videoinput');
  const audioDevices = useMediaDevices('audioinput');

  const videoEl = React.useRef(null);
  const audioEl = React.useRef(null);
  const [localVideoTrack, setLocalVideoTrack] = React.useState<LocalVideoTrack>();
  const [localVideoDeviceId, setLocalVideoDeviceId] = React.useState<string>();

  const [localAudioTrack, setLocalAudioTrack] = React.useState<LocalAudioTrack>();
  const [localAudioDeviceId, setLocalAudioDeviceId] = React.useState<string>();

  const [isValid, setIsValid] = React.useState<boolean>();

  React.useEffect(() => {
    if (videoEnabled) {
      createLocalVideoTrack({
        deviceId: selectedVideoDevice?.deviceId,
        resolution: VideoPresets.h720.resolution,
      }).then(async (track) => {
        setLocalVideoTrack(track);
        const deviceId = await track.getDeviceId();
        setLocalVideoDeviceId(deviceId);
      });
    } else {
      localVideoTrack?.detach();
      setLocalVideoTrack(undefined);
    }
  }, [selectedVideoDevice, videoEnabled, localVideoTrack]);

  React.useEffect(() => {
    if (audioEnabled) {
      createLocalAudioTrack({
        deviceId: selectedAudioDevice?.deviceId,
      }).then(async (track) => {
        setLocalAudioTrack(track);
        const deviceId = await track.getDeviceId();
        setLocalAudioDeviceId(deviceId);
      });
    } else {
      localAudioTrack?.detach();
      setLocalAudioTrack(undefined);
    }
  }, [selectedAudioDevice, audioEnabled, localAudioTrack]);

  React.useEffect(() => {
    if (videoEl.current) localVideoTrack?.attach(videoEl.current);
  }, [localVideoTrack, videoEl, selectedVideoDevice]);

  React.useEffect(() => {
    setSelectedVideoDevice(videoDevices.find((dev) => dev.deviceId === localVideoDeviceId));
  }, [localVideoDeviceId, videoDevices]);

  React.useEffect(() => {
    setSelectedAudioDevice(audioDevices.find((dev) => dev.deviceId === localAudioDeviceId));
  }, [localAudioDeviceId, audioDevices]);

  const handleValidation = React.useCallback(
    (values: LocalUserChoices) => {
      if (typeof onValidate === 'function') {
        return onValidate(values);
      } else {
        return values.username !== '';
      }
    },
    [onValidate],
  );

  React.useEffect(() => {
    const newUserChoices = {
      username: username,
      videoEnabled: videoEnabled,
      audioEnabled: audioEnabled,
      videoDeviceId: selectedVideoDevice?.deviceId ?? '',
      audioDeviceId: selectedAudioDevice?.deviceId ?? '',
    };
    setUserChoices(newUserChoices);
    setIsValid(handleValidation(newUserChoices));
  }, [
    username,
    videoEnabled,
    audioEnabled,
    selectedAudioDevice,
    selectedVideoDevice,
    handleValidation,
  ]);

  function handleSubmit() {
    if (handleValidation(userChoices)) {
      if (typeof onSubmit === 'function') {
        onSubmit(userChoices);
      }
    } else {
      console.warn('Validation failed with: ', userChoices);
    }
  }

  return (
    <div {...htmlProps}>
      {localVideoTrack ? (
        <div>
          <video
            ref={videoEl}
            style={{ width: '20rem', height: 'auto', transform: 'rotateY(180deg)' }}
          />
        </div>
      ) : (
        <div style={{ width: '20rem', height: '11.25rem', backgroundColor: 'black' }}>
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
      <div className="media-controls">
        <div
          className="video"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <MediaControlButton
            initialState={videoEnabled}
            source={Track.Source.Camera}
            onChange={(enabled) => setVideoEnabled(enabled)}
          ></MediaControlButton>
          <DeviceSelectButton
            kind="videoinput"
            onActiveDeviceChange={(_, deviceId) =>
              setSelectedVideoDevice(videoDevices.find((d) => d.deviceId === deviceId))
            }
          >
            {selectedVideoDevice?.label ?? 'Default'}
          </DeviceSelectButton>
        </div>
        <div
          className="audio"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <MediaControlButton
            initialState={videoEnabled}
            source={Track.Source.Microphone}
            onChange={(enabled) => setAudioEnabled(enabled)}
          ></MediaControlButton>
          <DeviceSelectButton
            kind="audioinput"
            onActiveDeviceChange={(_, deviceId) =>
              setSelectedAudioDevice(audioDevices.find((d) => d.deviceId === deviceId))
            }
          >
            {selectedAudioDevice?.label ?? 'Default'}
          </DeviceSelectButton>
        </div>

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
      </div>

      <button className="lk-button lk-join-button" onClick={handleSubmit} disabled={!isValid}>
        Join
      </button>
      {debug && (
        <>
          <strong>User Choices:</strong>
          <ul style={{ overflow: 'hidden', maxWidth: '15rem' }}>
            <li>Username: {`${userChoices.username}`}</li>
            <li>Video Enabled: {`${userChoices.videoEnabled}`}</li>
            <li>Audio Enabled: {`${userChoices.audioEnabled}`}</li>
            <li>Video Device: {`${userChoices.videoDeviceId}`}</li>
            <li>Audio Device: {`${userChoices.audioDeviceId}`}</li>
          </ul>
        </>
      )}
    </div>
  );
};
