import type {
  CreateLocalTracksOptions,
  LocalAudioTrack,
  LocalTrack,
  LocalVideoTrack,
  TrackProcessor,
} from 'livekit-client';
import {
  createLocalAudioTrack,
  createLocalTracks,
  createLocalVideoTrack,
  facingModeFromLocalTrack,
  Track,
  VideoPresets,
  Mutex,
} from 'livekit-client';
import * as React from 'react';
import { getPrejoinTranslations, type PrejoinLanguage } from './prejoinTranslations';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { TrackToggle } from '../components/controls/TrackToggle';
import type { LocalUserChoices } from '@livekit/components-core';
import { log } from '@livekit/components-core';
import { ParticipantPlaceholder } from '../assets/images';
import { PermissionsModal } from '../components/PermissionsModal';
import { useMediaDevices, usePersistentUserChoices } from '../hooks';
import { useWarnAboutMissingStyles } from '../hooks/useWarnAboutMissingStyles';
import { roomOptionsStringifyReplacer } from '../utils';
import { useSelectedDevice } from '../hooks/useSelectedDevice';

// Device status type definition
type DeviceStatus = 'available' | 'permission-denied' | 'no-devices' | 'disabled' | 'error';

/**
 * Enhanced error class that includes device information for better error handling.
 * This extends the original error to preserve all its properties while adding device context.
 * @public
 */
export class DevicePermissionError extends Error {
  public deviceType: 'audio' | 'video';
  public deviceId?: string;

  constructor(originalError: Error, deviceType: 'audio' | 'video', deviceId?: string) {
    // Call the parent Error constructor with the original error's message
    super(originalError.message);

    // Preserve all properties from the original error
    Object.assign(this, originalError);

    // Add our custom properties
    this.deviceType = deviceType;
    this.deviceId = deviceId;
    this.name = 'DevicePermissionError';

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DevicePermissionError.prototype);
  }
}

/**
 * Extended values type that includes both user choices and device availability
 * @public
 */
export type PreJoinValues = LocalUserChoices & {
  audioAvailable: boolean;
  videoAvailable: boolean;
};

/**
 * Props for the PreJoin component.
 * @public
 */
export interface PreJoinProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSubmit' | 'onError'
> {
  /** This function is called with the `PreJoinValues` if validation is passed. */
  onSubmit?: (values: PreJoinValues) => void;
  /**
   * Provide your custom validation function. Only if validation is successful the user choices are passed to the onSubmit callback.
   */
  onValidate?: (values: PreJoinValues) => boolean;
  /**
   * Called when an error occurs during device setup. Permission errors will be wrapped in
   * `DevicePermissionError` with device context. Other errors (NotFoundError, NotReadableError, etc.)
   * are passed through as-is.
   */
  onError?: (error: Error) => void;
  /** Prefill the input form with initial values. */
  defaults?: Partial<LocalUserChoices>;
  /** Display a debug window for your convenience. */
  debug?: boolean;
  joinLabel?: string;
  micLabel?: string;
  camLabel?: string;
  userLabel?: string;
  /** Language for built-in labels/text. */
  language?: PrejoinLanguage;
  /**
   * If true, user choices are persisted across sessions.
   * @defaultValue true
   * @alpha
   */
  persistUserChoices?: boolean;
  videoProcessor?: TrackProcessor<Track.Kind.Video>;
}

/** @public */
export function usePreviewTracks(
  options: CreateLocalTracksOptions,
  onError?: (err: Error) => void,
  setPermissionErrors?: React.Dispatch<React.SetStateAction<{ audio?: Error; video?: Error }>>,
) {
  const [audioTrack, setAudioTrack] = React.useState<LocalAudioTrack | undefined>();
  const [videoTrack, setVideoTrack] = React.useState<LocalVideoTrack | undefined>();

  const [orphanTracks, setOrphanTracks] = React.useState<Track[]>([]);

  React.useEffect(
    () => () => {
      orphanTracks.forEach((track) => track.stop());
    },
    [orphanTracks],
  );

  const trackLock = React.useMemo(() => new Mutex(), []);

  // Utility to detect permission-denied style errors across browsers/wrappers
  const isDeniedError = (err: Error | undefined): boolean => {
    if (!err) return false;
    const name = (err.name || '').toLowerCase();
    const message = (err.message || '').toLowerCase();
    return (
      name.includes('notallowed') ||
      name.includes('permissiondenied') ||
      name.includes('security') ||
      message.includes('permission denied') ||
      message.includes('denied by system') ||
      message.includes('blocked')
    );
  };

  // Store current tracks in refs to avoid dependency cycles
  const audioTrackRef = React.useRef<LocalAudioTrack | undefined>(audioTrack);
  const videoTrackRef = React.useRef<LocalVideoTrack | undefined>(videoTrack);

  // Update refs when state changes
  React.useEffect(() => {
    audioTrackRef.current = audioTrack;
  }, [audioTrack]);

  React.useEffect(() => {
    videoTrackRef.current = videoTrack;
  }, [videoTrack]);

  // Shared function to handle track creation and cleanup
  const handleTrackCreation = React.useCallback(
    <T extends 'audio' | 'video'>(
      trackType: T,
      trackOption: CreateLocalTracksOptions[T] | false,
      setTrack: React.Dispatch<
        React.SetStateAction<T extends 'audio' ? LocalAudioTrack | undefined : LocalVideoTrack | undefined>
      >,
      setPermissionErrors: React.Dispatch<React.SetStateAction<{ audio?: Error; video?: Error }>>,
    ) => {
      log.debug(`[PreJoin] handleTrackCreation called for ${trackType}`, { trackOption });

      if (!trackOption) {
        log.debug(`[PreJoin] ${trackType} track disabled, skipping creation`);
        const currentTrack = trackType === 'audio' ? audioTrackRef.current : videoTrackRef.current;

        if (currentTrack) {
          setOrphanTracks((prev) => [...prev, currentTrack]);
          setTrack(undefined);
        }
        return;
      }

      let isCancelled = false;
      let localTrack: LocalTrack | undefined;

      trackLock.lock().then(async (unlock) => {
        try {
          log.debug(`[PreJoin] Attempting to create ${trackType} track`);

          // Check if cancelled before creating tracks
          if (isCancelled) {
            log.debug(`[PreJoin] ${trackType} track creation cancelled before start`);
            return;
          }

          const trackOptions: CreateLocalTracksOptions = {
            audio:
              trackType === 'audio' ? (trackOption as CreateLocalTracksOptions['audio']) : false,
            video:
              trackType === 'video' ? (trackOption as CreateLocalTracksOptions['video']) : false,
          };

          log.debug(`[PreJoin] Calling createLocalTracks for ${trackType}`, trackOptions);
          const tracks = await createLocalTracks(trackOptions);
          log.debug(`[PreJoin] Successfully created ${trackType} track`);

          // Check if cancelled after creating tracks
          if (isCancelled) {
            // Clean up the tracks we just created
            tracks.forEach((track) => track.stop());
            return;
          }

          localTrack = tracks.find((track) => track.kind === trackType);

          if (localTrack) {
            // Stop previous track if it exists
            const currentTrack =
              trackType === 'audio' ? audioTrackRef.current : videoTrackRef.current;

            if (currentTrack) {
              setOrphanTracks((prev) => [...prev, currentTrack]);
            }
            if (trackType === 'audio' && localTrack.kind === 'audio') {
              setTrack(localTrack as T extends 'audio' ? LocalAudioTrack | undefined : never);
            } else if (trackType === 'video' && localTrack.kind === 'video') {
              setTrack(localTrack as T extends 'audio' ? never : LocalVideoTrack | undefined);
            }
          }
        } catch (e: unknown) {
          log.error(`[PreJoin] Error creating ${trackType} track:`, e);

          if (onError && e instanceof Error) {
            // Extract device ID for error context
            const deviceId =
              typeof trackOption === 'object' && trackOption !== null
                ? typeof trackOption.deviceId === 'string'
                  ? trackOption.deviceId
                  : Array.isArray(trackOption.deviceId)
                    ? trackOption.deviceId[0]
                    : undefined
                : undefined;

            // Wrap permission errors with enhanced context
            if (isDeniedError(e)) {
              log.debug(`[PreJoin] ${trackType} permission denied, calling onError`);
              const enhancedError = new DevicePermissionError(e, trackType, deviceId);
              onError(enhancedError);

              // Track permission errors for UI feedback
              setPermissionErrors((prev) => ({ ...prev, [trackType]: enhancedError }));
            } else {
              // For other errors (NotFoundError, NotReadableError, etc.),
              // still wrap with device context so consumers know which track failed
              log.debug(
                `[PreJoin] ${trackType} error (non-permission), calling onError with context`,
              );
              const errorWithContext = new DevicePermissionError(e, trackType, deviceId);
              errorWithContext.name = e.name; // Preserve original error name
              onError(errorWithContext);
            }
          } else {
            log.error(e);
          }
        } finally {
          unlock();
        }
      });

      return () => {
        isCancelled = true;
        if (localTrack) {
          localTrack.stop();
        }
      };
    },
    [trackLock, onError, setOrphanTracks],
  );

  // Memoize the stringified options to prevent unnecessary re-renders
  const audioOptionsString = React.useMemo(
    () => JSON.stringify(options.audio, roomOptionsStringifyReplacer),
    [options.audio],
  );
  const videoOptionsString = React.useMemo(
    () => JSON.stringify(options.video, roomOptionsStringifyReplacer),
    [options.video],
  );

  // Create stable fallback function for setPermissionErrors
  const noopSetPermissionErrors = React.useCallback(() => {}, []);
  const stableSetPermissionErrors = setPermissionErrors || noopSetPermissionErrors;

  // Handle audio track
  React.useEffect(() => {
    return handleTrackCreation('audio', options.audio, setAudioTrack, stableSetPermissionErrors);
  }, [handleTrackCreation, audioOptionsString, stableSetPermissionErrors]);

  // Handle video track
  React.useEffect(() => {
    return handleTrackCreation('video', options.video, setVideoTrack, stableSetPermissionErrors);
  }, [handleTrackCreation, videoOptionsString, stableSetPermissionErrors]);

  // Combine tracks for the return value
  const tracks = React.useMemo(() => {
    const result: LocalTrack[] = [];
    if (audioTrack) result.push(audioTrack);
    if (videoTrack) result.push(videoTrack);
    return result.length > 0 ? result : undefined;
  }, [audioTrack, videoTrack]);

  return tracks;
}
/**
 * @public
 * @deprecated use `usePreviewTracks` instead
 */
export function usePreviewDevice<T extends LocalVideoTrack | LocalAudioTrack>(
  enabled: boolean,
  deviceId: string,
  kind: 'videoinput' | 'audioinput',
) {
  const [deviceError, setDeviceError] = React.useState<DevicePermissionError | null>(null);
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
              deviceId,
              resolution: VideoPresets.h720.resolution,
            })
          : await createLocalAudioTrack({ deviceId });

      const newDeviceId = await track.getDeviceId(false);
      if (newDeviceId && deviceId !== newDeviceId) {
        prevDeviceId.current = newDeviceId;
        setLocalDeviceId(newDeviceId);
      }
      setLocalTrack(track as T);
    } catch (e) {
      if (e instanceof Error) {
        // Create enhanced error with device context
        const enhancedError = new DevicePermissionError(
          e,
          kind === 'videoinput' ? 'video' : 'audio',
          deviceId,
        );
        setDeviceError(enhancedError);
      }
    }
  };

  const switchDevice = async (track: LocalVideoTrack | LocalAudioTrack, id: string) => {
    await track.setDeviceId(id);
    prevDeviceId.current = id;
  };

  const prevDeviceId = React.useRef(localDeviceId);

  React.useEffect(() => {
    if (!isCreatingTrack && enabled && !localTrack && !deviceError) {
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
    setSelectedDevice(devices?.find((dev) => dev.deviceId === localDeviceId));
  }, [localDeviceId, devices]);

  return {
    selectedDevice,
    localTrack,
    deviceError,
  };
}

/**
 * The `PreJoin` prefab component is normally presented to the user before he enters a room.
 * This component allows the user to check and select the preferred media device (camera and microphone).
 * On submit the user decisions are returned, which can then be passed on to the `LiveKitRoom` so that the user enters the room with the correct media devices.
 *
 * @remarks
 * This component is independent of the `LiveKitRoom` component and should not be nested within it.
 * Because it only accesses the local media tracks this component is self-contained and works without connection to the LiveKit server.
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
  language = 'en',
  joinLabel: joinLabelProp,
  micLabel: micLabelProp,
  camLabel: camLabelProp,
  userLabel: userLabelProp,
  persistUserChoices = true,
  videoProcessor,
  ...htmlProps
}: PreJoinProps) {
  const t = getPrejoinTranslations(language);
  const joinLabel = joinLabelProp ?? t.join;
  const micLabel = micLabelProp ?? t.microphone;
  const camLabel = camLabelProp ?? t.camera;
  const userLabel = userLabelProp ?? t.username;
  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
    saveUsername,
  } = usePersistentUserChoices({
    defaults,
    preventSave: !persistUserChoices,
    preventLoad: !persistUserChoices,
  });

  // Get device lists for availability checking (only when needed)
  const audioDevices = useMediaDevices({ kind: 'audioinput' });
  const videoDevices = useMediaDevices({ kind: 'videoinput' });

  const [userChoices, setUserChoices] = React.useState(initialUserChoices);

  // Initialize device settings
  const [audioEnabled, setAudioEnabled] = React.useState<boolean>(userChoices.audioEnabled);
  const [videoEnabled, setVideoEnabled] = React.useState<boolean>(userChoices.videoEnabled);
  const [audioDeviceId, setAudioDeviceId] = React.useState<string>(userChoices.audioDeviceId);
  const [videoDeviceId, setVideoDeviceId] = React.useState<string>(userChoices.videoDeviceId);
  const [username, setUsername] = React.useState(userChoices.username);

  // Track permission errors
  const [permissionErrors, setPermissionErrors] = React.useState<{
    audio?: Error;
    video?: Error;
  }>({});

  // Track if we should show permission instructions modal
  const [showPermissionModal, setShowPermissionModal] = React.useState<boolean>(false);

  // Track which permissions are denied for modal content
  const [deniedPermissions, setDeniedPermissions] = React.useState<{
    audio: boolean;
    video: boolean;
  }>({ audio: false, video: false });

  // Enhanced device availability and permission checking
  const isDeviceAvailable = React.useCallback(
    (type: 'audio' | 'video') => {
      const devices = type === 'audio' ? audioDevices : videoDevices;
      return devices.length > 0;
    },
    [audioDevices, videoDevices],
  );

  const hasPermissionError = React.useCallback(
    (type: 'audio' | 'video') => {
      return !!permissionErrors[type];
    },
    [permissionErrors],
  );

  const isPermissionDenied = React.useCallback(
    (type: 'audio' | 'video') => {
      const error = permissionErrors[type];
      if (!error) return false;
      const name = (error.name || '').toLowerCase();
      const message = (error.message || '').toLowerCase();
      return (
        name.includes('notallowed') ||
        name.includes('permissiondenied') ||
        message.includes('permission denied') ||
        message.includes('denied by system') ||
        message.includes('blocked')
      );
    },
    [permissionErrors],
  );

  // Create device status for LocalUserChoices compatibility
  const deviceStatus = React.useMemo(
    () =>
      ({
        audio: (() => {
          if (hasPermissionError('audio')) {
            return isPermissionDenied('audio') ? 'permission-denied' : 'error';
          }
          return isDeviceAvailable('audio') ? 'available' : 'no-devices';
        })(),
        video: (() => {
          if (hasPermissionError('video')) {
            return isPermissionDenied('video') ? 'permission-denied' : 'error';
          }
          return isDeviceAvailable('video') ? 'available' : 'no-devices';
        })(),
      }) as { audio: DeviceStatus; video: DeviceStatus },
    [isDeviceAvailable, hasPermissionError, isPermissionDenied],
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
      video: videoEnabled
        ? { deviceId: initialUserChoices.videoDeviceId, processor: videoProcessor }
        : false,
    },
    onError,
    setPermissionErrors,
  );

  // Initial permission check to detect if permissions are already denied
  React.useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Try to access media streams to check permissions
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach((track) => track.stop());

        // If we get here, audio permission is granted
        setPermissionErrors((prev) => ({ ...prev, audio: undefined }));
      } catch (audioError) {
        // Audio permission denied
        if (audioError instanceof Error) {
          setPermissionErrors((prev) => ({ ...prev, audio: audioError }));

          if (onError) {
            const enhancedError = new DevicePermissionError(audioError, 'audio');
            onError(enhancedError);
          }
        }
      }

      try {
        // Try to access video stream to check permissions
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStream.getTracks().forEach((track) => track.stop());

        // If we get here, video permission is granted
        setPermissionErrors((prev) => ({ ...prev, video: undefined }));
      } catch (videoError) {
        // Video permission denied
        if (videoError instanceof Error) {
          setPermissionErrors((prev) => ({ ...prev, video: videoError }));

          if (onError) {
            const enhancedError = new DevicePermissionError(videoError, 'video');
            onError(enhancedError);
          }
        }
      }
    };

    checkPermissions();
  }, [onError]); // Run once on mount

  // Debug logging (only when debug is enabled)
  React.useEffect(() => {
    if (debug) {
      log.debug('PreJoin state:', {
        audioEnabled,
        videoEnabled,
        audioDeviceId: initialUserChoices.audioDeviceId,
        videoDeviceId: initialUserChoices.videoDeviceId,
        tracks: tracks?.length || 0,
        isDeviceAvailable: {
          audio: isDeviceAvailable('audio'),
          video: isDeviceAvailable('video'),
        },
      });
    }
  }, [
    debug,
    audioEnabled,
    videoEnabled,
    initialUserChoices.audioDeviceId,
    initialUserChoices.videoDeviceId,
    tracks,
    isDeviceAvailable,
  ]);

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

  const { selectedDevice: selectedAudioDevice } = useSelectedDevice({
    kind: 'audioinput',
    track: audioTrack,
    deviceId: audioDeviceId,
  });
  const { selectedDevice: selectedVideoDevice } = useSelectedDevice({
    kind: 'videoinput',
    track: videoTrack,
    deviceId: videoDeviceId,
  });

  React.useEffect(() => {
    const videoElement = videoEl.current;
    if (videoElement && videoTrack) {
      videoTrack.unmute();
      videoTrack.attach(videoElement);
    }

    return () => {
      if (videoTrack) {
        if (videoElement) videoTrack.detach(videoElement);
        videoTrack.stop();
      }
    };
  }, [videoTrack]);

  const [isValid, setIsValid] = React.useState<boolean>();

  const handleValidation = React.useCallback(
    (values: LocalUserChoices) => {
      const extendedValues: PreJoinValues = {
        ...values,
        audioAvailable: isDeviceAvailable('audio'),
        videoAvailable: isDeviceAvailable('video'),
      };

      if (typeof onValidate === 'function') {
        return onValidate(extendedValues);
      } else {
        return values.username !== '';
      }
    },
    [onValidate, isDeviceAvailable],
  );

  React.useEffect(() => {
    const newUserChoices = {
      username,
      videoEnabled,
      videoDeviceId,
      audioEnabled,
      audioDeviceId,
      deviceStatus,
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
    deviceStatus,
  ]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (handleValidation(userChoices)) {
      if (typeof onSubmit === 'function') {
        const extendedValues: PreJoinValues = {
          ...userChoices,
          audioAvailable: isDeviceAvailable('audio'),
          videoAvailable: isDeviceAvailable('video'),
        };
        onSubmit(extendedValues);
      }
    } else {
      log.warn('Validation failed with: ', userChoices);
    }
  }

  useWarnAboutMissingStyles();

  React.useEffect(() => {
    if (!debug) return;
    // Log only when key states change
    // eslint-disable-next-line no-console
    console.log({
      permissionDeniedAudio: isPermissionDenied('audio'),
      permissionErrorAudio: hasPermissionError('audio'),
      permissionDeniedVideo: isPermissionDenied('video'),
      permissionErrorVideo: hasPermissionError('video'),
      audioEnabled,
      videoEnabled,
      permissionErrors,
    });
  }, [debug, permissionErrors, audioEnabled, videoEnabled, isPermissionDenied, hasPermissionError]);

  // If permission becomes denied, stop attempting to create local tracks to avoid churn
  const audioPermissionDenied = hasPermissionError('audio');
  const videoPermissionDenied = hasPermissionError('video');

  React.useEffect(() => {
    if (audioPermissionDenied && audioEnabled) {
      setAudioEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPermissionDenied]); // Only depend on permission state, not audioEnabled

  React.useEffect(() => {
    if (videoPermissionDenied && videoEnabled) {
      setVideoEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoPermissionDenied]); // Only depend on permission state, not videoEnabled

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
        <div className="lk-button-group-pre-join audio">
          <TrackToggle
            permissionDenied={hasPermissionError('audio')}
            initialState={audioEnabled}
            source={Track.Source.Microphone}
            onClick={
              hasPermissionError('audio')
                ? () => {
                    setDeniedPermissions({
                      audio: hasPermissionError('audio'),
                      video: hasPermissionError('video'),
                    });
                    setShowPermissionModal(true);
                  }
                : undefined
            }
            onChange={(enabled) => {
              // Only update if not in permission denied state to avoid toggle loops
              if (!hasPermissionError('audio')) {
                setAudioEnabled(enabled);
              }
            }}
          />
          <div className="lk-button-group-menu-pre-join">
            <label className="lk-selected-device-label">
              {selectedAudioDevice?.label || micLabel}
            </label>
          </div>
          <MediaDeviceMenu
            initialSelection={audioDeviceId}
            kind="audioinput"
            disabled={Boolean(!selectedAudioDevice)}
            tracks={{ audioinput: audioTrack }}
            onActiveDeviceChange={(_, id) => setAudioDeviceId(id)}
          />
        </div>
        <div className="lk-button-group-pre-join video">
          <TrackToggle
            permissionDenied={hasPermissionError('video')}
            initialState={videoEnabled}
            source={Track.Source.Camera}
            onClick={
              hasPermissionError('video')
                ? () => {
                    setDeniedPermissions({
                      audio: hasPermissionError('audio'),
                      video: hasPermissionError('video'),
                    });
                    setShowPermissionModal(true);
                  }
                : undefined
            }
            onChange={(enabled) => {
              // Only update if not in permission denied state to avoid toggle loops
              if (!hasPermissionError('video')) {
                setVideoEnabled(enabled);
              }
            }}
          />
          <div className="lk-button-group-menu-pre-join">
            <label className="lk-selected-device-label">
              {selectedVideoDevice?.label || camLabel}
            </label>
          </div>
          <MediaDeviceMenu
            initialSelection={videoDeviceId}
            kind="videoinput"
            disabled={Boolean(!selectedVideoDevice)}
            tracks={{ videoinput: videoTrack }}
            onActiveDeviceChange={(_, id) => setVideoDeviceId(id)}
          />
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
          <strong>{t.debugUserChoices}</strong>
          <ul className="lk-list" style={{ overflow: 'hidden', maxWidth: '15rem' }}>
            <li>
              {t.debugUsername}: {`${userChoices.username}`}
            </li>
            <li>
              {t.debugVideoEnabled}: {`${userChoices.videoEnabled}`}
            </li>
            <li>
              {t.debugAudioEnabled}: {`${userChoices.audioEnabled}`}
            </li>
            <li>
              {t.debugVideoDevice}: {`${userChoices.videoDeviceId}`}
            </li>
            <li>
              {t.debugAudioDevice}: {`${userChoices.audioDeviceId}`}
            </li>
            <li>
              {t.debugAudioAvailable}: {`${isDeviceAvailable('audio')}`}
            </li>
            <li>
              {t.debugVideoAvailable}: {`${isDeviceAvailable('video')}`}
            </li>
            <li>
              {t.debugAudioPermDenied}: {`${isPermissionDenied('audio')}`}
            </li>
            <li>
              {t.debugVideoPermDenied}: {`${isPermissionDenied('video')}`}
            </li>
            <li>
              {t.debugAudioPermError}: {`${permissionErrors.audio?.name || 'none'}`}
            </li>
            <li>
              {t.debugVideoPermError}: {`${permissionErrors.video?.name || 'none'}`}
            </li>
          </ul>
        </>
      )}

      {showPermissionModal && (
        <PermissionsModal
          language={language}
          deniedPermissions={deniedPermissions}
          onClose={() => setShowPermissionModal(false)}
        />
      )}
    </div>
  );
}
