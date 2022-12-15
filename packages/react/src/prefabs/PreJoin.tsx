import {
  createLocalAudioTrack,
  createLocalVideoTrack,
  getEmptyAudioStreamTrack,
  getEmptyVideoStreamTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  Track,
  VideoPresets,
} from 'livekit-client';
import * as React from 'react';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { useMediaDevices } from '../components/controls/MediaDeviceSelect';
import { TrackToggle } from '../components/controls/TrackToggle';

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

export type PreJoinProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> & {
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

  const videoDevices = useMediaDevices({ kind: 'videoinput' });
  const audioDevices = useMediaDevices({ kind: 'audioinput' });

  const videoEl = React.useRef(null);
  const audioEl = React.useRef(null);
  const [localVideoTrack, setLocalVideoTrack] = React.useState<LocalVideoTrack>();
  const [localVideoDeviceId, setLocalVideoDeviceId] = React.useState<string>();

  const [localAudioTrack, setLocalAudioTrack] = React.useState<LocalAudioTrack>();
  const [localAudioDeviceId, setLocalAudioDeviceId] = React.useState<string>();

  const [isValid, setIsValid] = React.useState<boolean>();

  const createVideoTrack = async (deviceId?: string | undefined) => {
    const track = await createLocalVideoTrack({
      deviceId: deviceId,
      resolution: VideoPresets.h720.resolution,
    });

    const newDeviceId = await track.getDeviceId();
    setLocalVideoTrack(track);
    if (deviceId !== newDeviceId) {
      setLocalVideoDeviceId(newDeviceId);
    }
  };

  const createAudioTrack = async (deviceId?: string | undefined) => {
    const track = await createLocalAudioTrack({
      deviceId: deviceId,
    });

    const newDeviceId = await track.getDeviceId();
    setLocalAudioTrack(track);
    if (deviceId !== newDeviceId) {
      setLocalAudioDeviceId(newDeviceId);
    }
  };

  React.useEffect(() => {
    if (videoEnabled) {
      if (!localVideoTrack) {
        setLocalVideoTrack(new LocalVideoTrack(getEmptyVideoStreamTrack()));
        createVideoTrack();
      } else {
        localVideoTrack?.restartTrack({
          deviceId: selectedVideoDevice?.deviceId,
        });
      }
    } else {
      localVideoTrack?.mute();
    }
    return () => {
      localVideoTrack?.stop();
    };
  }, [videoEnabled, localVideoTrack, selectedVideoDevice]);

  React.useEffect(() => {
    if (audioEnabled) {
      if (!localAudioTrack) {
        setLocalAudioTrack(new LocalAudioTrack(getEmptyAudioStreamTrack()));
        createAudioTrack();
      } else {
        localAudioTrack?.restartTrack({
          deviceId: selectedAudioDevice?.deviceId,
        });
      }
    } else {
      localAudioTrack?.mute();
    }
    return () => {
      localAudioTrack?.stop();
    };
  }, [audioEnabled, localAudioTrack, selectedAudioDevice]);

  React.useEffect(() => {
    if (videoEl.current) localVideoTrack?.attach(videoEl.current);
  }, [localVideoTrack, videoEl]);

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
    <div className="lk-prejoin" {...htmlProps}>
      {localVideoTrack ? (
        <video ref={videoEl} />
      ) : (
        <div className="lk-camera-off-note">Camera is off</div>
      )}
      {localAudioTrack ? (
        <div className="lk-audio-container">
          <audio ref={audioEl} />
        </div>
      ) : (
        <></>
      )}
      <div className="lk-button-group-container">
        <div className="lk-button-group audio">
          <TrackToggle
            initialState={videoEnabled}
            source={Track.Source.Microphone}
            onChange={(enabled) => setAudioEnabled(enabled)}
          >
            Microphone
          </TrackToggle>
          <div className="lk-button-group-menu">
            {selectedAudioDevice?.deviceId && (
              <MediaDeviceMenu
                kind="audioinput"
                initialSelection={selectedAudioDevice.deviceId}
                onActiveDeviceChange={(_, deviceId) =>
                  setSelectedAudioDevice(audioDevices.find((d) => d.deviceId === deviceId))
                }
              >
                {/* {selectedAudioDevice?.label ?? 'Default'} */}
              </MediaDeviceMenu>
            )}
          </div>
        </div>
        <div className="lk-button-group video">
          <TrackToggle
            initialState={videoEnabled}
            source={Track.Source.Camera}
            onChange={(enabled) => setVideoEnabled(enabled)}
          >
            Camera
          </TrackToggle>
          <div className="lk-button-group-menu">
            {selectedVideoDevice?.deviceId && (
              <MediaDeviceMenu
                initialSelection={selectedVideoDevice.deviceId}
                kind="videoinput"
                onActiveDeviceChange={(_, deviceId) =>
                  setSelectedVideoDevice(videoDevices.find((d) => d.deviceId === deviceId))
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className="lk-username-container">
        {/* <label htmlFor="username">Username</label> */}
        <input
          className="form-control"
          id="username"
          name="username"
          type="text"
          // defaultValue={username}
          placeholder="Username"
          onChange={(inputEl) => setUsername(inputEl.target.value)}
        />
        <button className="lk-button lk-join-button" onClick={handleSubmit} disabled={!isValid}>
          Join room
        </button>
      </div>

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
