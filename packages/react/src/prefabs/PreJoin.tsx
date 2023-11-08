import type {
  CreateLocalTracksOptions,
  LocalAudioTrack,
  LocalTrack,
  LocalVideoTrack,
} from 'livekit-client';
import {
  createLocalAudioTrack,
  createLocalTracks,
  createLocalVideoTrack,
  facingModeFromLocalTrack,
  Track,
  VideoPresets,
} from 'livekit-client';
import * as React from 'react';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { TrackToggle } from '../components/controls/TrackToggle';
import type { LocalUserChoices } from '@livekit/components-core';
import { log } from '@livekit/components-core';
import { ParticipantPlaceholder } from '../assets/images';
import { useMediaDevices, usePersistentUserChoices } from '../hooks';

const DEFAULT_USER_CHOICES: LocalUserChoices = {
  username: '',
  videoEnabled: true,
  audioEnabled: true,
  videoDeviceId: 'default',
  audioDeviceId: 'default',
  e2ee: false,
  sharedPassphrase: '',
};

/**
 * Props for the PreJoin component.
 * @public
 */
export interface PreJoinProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit' | 'onError'> {
  /** This function is called with the `LocalUserChoices` if validation is passed. */
  onSubmit?: (values: LocalUserChoices) => void;
  /**
   * Provide your custom validation function. Only if validation is successful the user choices are past to the onSubmit callback.
   */
  onValidate?: (values: LocalUserChoices) => boolean;
  onError?: (error: Error) => void;
  /** Prefill the input form with initial values. */
  defaults?: Partial<LocalUserChoices>;
  /** Display a debug window for your convenience. */
  debug?: boolean;
  joinLabel?: string;
  micLabel?: string;
  camLabel?: string;
  userLabel?: string;
  /** @deprecated  E2EE options will be removed from PreJoin in a future version **/
  showE2EEOptions?: boolean;
  /**
   * If true, user choices are persisted across sessions.
   * @defaultValue true
   * @alpha
   */
  persistUserChoices?: boolean;
}

/** @alpha */
export function usePreviewTracks(
  options: CreateLocalTracksOptions,
  onError?: (err: Error) => void,
) {
  const [tracks, setTracks] = React.useState<LocalTrack[]>();

  React.useEffect(() => {
    let trackPromise: Promise<LocalTrack[]> | undefined = undefined;
    let needsCleanup = false;
    if (options.audio || options.video) {
      trackPromise = createLocalTracks(options);
      trackPromise
        .then((tracks) => {
          if (needsCleanup) {
            tracks.forEach((tr) => tr.stop());
          } else {
            setTracks(tracks);
          }
        })
        .catch(onError);
    }

    return () => {
      needsCleanup = true;
      trackPromise?.then((tracks) =>
        tracks.forEach((track) => {
          track.stop();
        }),
      );
    };
  }, [JSON.stringify(options)]);

  return tracks;
}

/** @public */
export function usePreviewDevice<T extends LocalVideoTrack | LocalAudioTrack>(
  enabled: boolean,
  deviceId: string,
  kind: 'videoinput' | 'audioinput',
) {
  const [deviceError, setDeviceError] = React.useState<Error | null>(null);
  const [isCreatingTrack, setIsCreatingTrack] = React.useState<boolean>(false);

  const devices = useMediaDevices({ kind });
  const [selectedDevice, setSelectedDevice] = React.useState<MediaDeviceInfo | undefined>(
    undefined,
  );

  const [localTrack, setLocalTrack] = React.useState<T>();
  const [localDeviceId, setLocalDeviceId] = React.useState<string>(deviceId);

  React.useEffect(() => {
    setLocalDeviceId(deviceId);
  }, [deviceId]);

  const createTrack = async (deviceId: string, kind: 'videoinput' | 'audioinput') => {
    try {
      const track =
        kind === 'videoinput'
          ? await createLocalVideoTrack({
              deviceId: deviceId,
              resolution: VideoPresets.h720.resolution,
            })
          : await createLocalAudioTrack({ deviceId });

      const newDeviceId = await track.getDeviceId();
      if (newDeviceId && deviceId !== newDeviceId) {
        prevDeviceId.current = newDeviceId;
        setLocalDeviceId(newDeviceId);
      }
      setLocalTrack(track as T);
    } catch (e) {
      if (e instanceof Error) {
        setDeviceError(e);
      }
    }
  };

  const switchDevice = async (track: LocalVideoTrack | LocalAudioTrack, id: string) => {
    await track.setDeviceId(id);
    prevDeviceId.current = id;
  };

  const prevDeviceId = React.useRef(localDeviceId);

  React.useEffect(() => {
    if (enabled && !localTrack && !deviceError && !isCreatingTrack) {
      log.debug('creating track', kind);
      setIsCreatingTrack(true);
      createTrack(localDeviceId, kind).finally(() => {
        setIsCreatingTrack(false);
      });
    }
  }, [enabled, localTrack, deviceError, isCreatingTrack]);

  // switch camera device
  React.useEffect(() => {
    if (!localTrack) {
      return;
    }
    if (!enabled) {
      log.debug(`muting ${kind} track`);
      localTrack.mute().then(() => log.debug(localTrack.mediaStreamTrack));
    } else if (selectedDevice?.deviceId && prevDeviceId.current !== selectedDevice?.deviceId) {
      log.debug(`switching ${kind} device from`, prevDeviceId.current, selectedDevice.deviceId);
      switchDevice(localTrack, selectedDevice.deviceId);
    } else {
      log.debug(`unmuting local ${kind} track`);
      localTrack.unmute();
    }
  }, [localTrack, selectedDevice, enabled, kind]);

  React.useEffect(() => {
    return () => {
      if (localTrack) {
        log.debug(`stopping local ${kind} track`);
        localTrack.stop();
        localTrack.mute();
      }
    };
  }, []);

  React.useEffect(() => {
    setSelectedDevice(devices.find((dev) => dev.deviceId === localDeviceId));
  }, [localDeviceId, devices]);

  return {
    selectedDevice,
    localTrack,
    deviceError,
  };
}

/**
 * The `PreJoin` prefab component is normally presented to the user before he enters a room.
 * This component allows the user to check and select the preferred media device (camera und microphone).
 * On submit the user decisions are returned, which can then be passed on to the `LiveKitRoom` so that the user enters the room with the correct media devices.
 *
 * @remarks
 * This component is independent of the `LiveKitRoom` component and should not be nested within it.
 * Because it only access the local media tracks this component is self contained and works without connection to the LiveKit server.
 *
 * @example
 * ```tsx
 * <PreJoin />
 * ```
 * @public
 */
export function PreJoin({
  defaults = {},
  onValidate,
  onSubmit,
  onError,
  debug,
  joinLabel = 'Join Room',
  micLabel = 'Microphone',
  camLabel = 'Camera',
  userLabel = 'Username',
  showE2EEOptions = false,
  persistUserChoices = true,
  ...htmlProps
}: PreJoinProps) {
  const [userChoices, setUserChoices] = React.useState(DEFAULT_USER_CHOICES);

  // TODO: Remove and pipe `defaults` object directly into `usePersistentUserChoices` once we fully switch from type `LocalUserChoices` to `UserChoices`.
  const partialDefaults: Partial<LocalUserChoices> = {
    ...(defaults.audioDeviceId !== undefined && { audioDeviceId: defaults.audioDeviceId }),
    ...(defaults.videoDeviceId !== undefined && { videoDeviceId: defaults.videoDeviceId }),
    ...(defaults.audioEnabled !== undefined && { audioEnabled: defaults.audioEnabled }),
    ...(defaults.videoEnabled !== undefined && { videoEnabled: defaults.videoEnabled }),
    ...(defaults.username !== undefined && { username: defaults.username }),
  };

  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
    saveUsername,
  } = usePersistentUserChoices({
    defaults: partialDefaults,
    preventSave: !persistUserChoices,
    preventLoad: !persistUserChoices,
  });

  // Initialize device settings
  const [audioEnabled, setAudioEnabled] = React.useState<boolean>(initialUserChoices.audioEnabled);
  const [videoEnabled, setVideoEnabled] = React.useState<boolean>(initialUserChoices.videoEnabled);
  const [audioDeviceId, setAudioDeviceId] = React.useState<string>(
    initialUserChoices.audioDeviceId,
  );
  const [videoDeviceId, setVideoDeviceId] = React.useState<string>(
    initialUserChoices.videoDeviceId,
  );
  const [username, setUsername] = React.useState(initialUserChoices.username);
  // TODO: Remove `e2ee` and `sharedPassphrase` once deprecated `LocalUserChoices` type is removed.
  const [e2ee, setE2ee] = React.useState<boolean>(defaults.e2ee ?? DEFAULT_USER_CHOICES.e2ee);
  const [sharedPassphrase, setSharedPassphrase] = React.useState<string>(
    defaults.sharedPassphrase ?? DEFAULT_USER_CHOICES.sharedPassphrase,
  );

  // Save user choices to persistent storage.
  React.useEffect(() => {
    saveAudioInputEnabled(audioEnabled);
  }, [audioEnabled, saveAudioInputEnabled]);
  React.useEffect(() => {
    saveVideoInputEnabled(videoEnabled);
  }, [videoEnabled, saveVideoInputEnabled]);
  React.useEffect(() => {
    saveAudioInputDeviceId(audioDeviceId);
  }, [audioDeviceId, saveAudioInputDeviceId]);
  React.useEffect(() => {
    saveVideoInputDeviceId(videoDeviceId);
  }, [videoDeviceId, saveVideoInputDeviceId]);
  React.useEffect(() => {
    saveUsername(username);
  }, [username, saveUsername]);

  const tracks = usePreviewTracks(
    {
      audio: audioEnabled ? { deviceId: initialUserChoices.audioDeviceId } : false,
      video: videoEnabled ? { deviceId: initialUserChoices.videoDeviceId } : false,
    },
    onError,
  );

  const videoEl = React.useRef(null);

  const videoTrack = React.useMemo(
    () => tracks?.filter((track) => track.kind === Track.Kind.Video)[0] as LocalVideoTrack,
    [tracks],
  );

  const facingMode = React.useMemo(() => {
    if (videoTrack) {
      const { facingMode } = facingModeFromLocalTrack(videoTrack);
      return facingMode;
    } else {
      return 'undefined';
    }
  }, [videoTrack]);

  const audioTrack = React.useMemo(
    () => tracks?.filter((track) => track.kind === Track.Kind.Audio)[0] as LocalAudioTrack,
    [tracks],
  );

  React.useEffect(() => {
    if (videoEl.current && videoTrack) {
      videoTrack.unmute();
      videoTrack.attach(videoEl.current);
    }

    return () => {
      videoTrack?.detach();
    };
  }, [videoTrack]);

  const [isValid, setIsValid] = React.useState<boolean>();

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
      username,
      videoEnabled,
      videoDeviceId,
      audioEnabled,
      audioDeviceId,
      e2ee,
      sharedPassphrase,
    };
    setUserChoices(newUserChoices);
    setIsValid(handleValidation(newUserChoices));
  }, [
    username,
    videoEnabled,
    handleValidation,
    audioEnabled,
    audioDeviceId,
    videoDeviceId,
    sharedPassphrase,
    e2ee,
  ]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (handleValidation(userChoices)) {
      if (typeof onSubmit === 'function') {
        onSubmit(userChoices);
      }
    } else {
      log.warn('Validation failed with: ', userChoices);
    }
  }

  return (
    <div className="lk-prejoin" {...htmlProps}>
      <div className="lk-video-container">
        {videoTrack && (
          <video ref={videoEl} width="1280" height="720" data-lk-facing-mode={facingMode} />
        )}
        {(!videoTrack || !videoEnabled) && (
          <div className="lk-camera-off-note">
            <ParticipantPlaceholder />
          </div>
        )}
      </div>
      <div className="lk-button-group-container">
        <div className="lk-button-group audio">
          <TrackToggle
            initialState={audioEnabled}
            source={Track.Source.Microphone}
            onChange={(enabled) => setAudioEnabled(enabled)}
          >
            {micLabel}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              initialSelection={audioDeviceId}
              kind="audioinput"
              disabled={!audioTrack}
              tracks={{ audioinput: audioTrack }}
              onActiveDeviceChange={(_, id) => setAudioDeviceId(id)}
            />
          </div>
        </div>
        <div className="lk-button-group video">
          <TrackToggle
            initialState={videoEnabled}
            source={Track.Source.Camera}
            onChange={(enabled) => setVideoEnabled(enabled)}
          >
            {camLabel}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              initialSelection={videoDeviceId}
              kind="videoinput"
              disabled={!videoTrack}
              tracks={{ videoinput: videoTrack }}
              onActiveDeviceChange={(_, id) => setVideoDeviceId(id)}
            />
          </div>
        </div>
      </div>

      <form className="lk-username-container">
        <input
          className="lk-form-control"
          id="username"
          name="username"
          type="text"
          defaultValue={username}
          placeholder={userLabel}
          onChange={(inputEl) => setUsername(inputEl.target.value)}
          autoComplete="off"
        />
        {showE2EEOptions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
              <input
                id="use-e2ee"
                type="checkbox"
                checked={e2ee}
                onChange={(ev) => setE2ee(ev.target.checked)}
              ></input>
              <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
            </div>
            {e2ee && (
              <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                <label htmlFor="passphrase">Passphrase</label>
                <input
                  id="passphrase"
                  type="password"
                  value={sharedPassphrase}
                  onChange={(ev) => setSharedPassphrase(ev.target.value)}
                />
              </div>
            )}
          </div>
        )}
        <button
          className="lk-button lk-join-button"
          type="submit"
          onClick={handleSubmit}
          disabled={!isValid}
        >
          {joinLabel}
        </button>
      </form>

      {debug && (
        <>
          <strong>User Choices:</strong>
          <ul className="lk-list" style={{ overflow: 'hidden', maxWidth: '15rem' }}>
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
}
