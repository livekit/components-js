import { LocalAudioTrack, LocalParticipant, LocalVideoTrack, Room } from 'livekit-client';
import { EventEmitter } from 'events';
import type TypedEventEmitter from 'typed-emitter';
import { AudioCaptureOptions, TrackPublication, ScreenShareCaptureOptions, Track, TrackPublishOptions, VideoCaptureOptions } from 'livekit-client';
import { type LocalUserChoices, SetMediaDeviceOptions, TrackReference, TrackReferenceOrPlaceholder, TrackReferencePlaceholder, loadUserChoices, saveUserChoices } from '@livekit/components-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMediaDeviceSelect } from './useMediaDeviceSelect';
import { useEnsureRoom } from '../context';
import { useLocalParticipant } from './useLocalParticipant';

type CaptureOptions<TrackSource extends Track.Source> =
  | (TrackSource extends Track.Source.Microphone ? AudioCaptureOptions : never)
  | (TrackSource extends Track.Source.Camera ? VideoCaptureOptions : never)
  | (TrackSource extends Track.Source.ScreenShare ? ScreenShareCaptureOptions : never);

export enum LocalTrackEvent {
  DeviceError = 'deviceError',
  PendingDisabled = 'pendingDisabled',
  DeviceListError = 'deviceListError',
  ActiveDeviceChangeError = 'activeDeviceChangeError',
};

export type LocalTrackCallbacks<TrackSource extends Track.Source> = {
  [LocalTrackEvent.DeviceError]: (error: Error, source: TrackSource) => void;
  [LocalTrackEvent.PendingDisabled]: () => void;
  [LocalTrackEvent.DeviceListError]: (error: Error, source: TrackSource) => void;
  [LocalTrackEvent.ActiveDeviceChangeError]: (error: Error, source: TrackSource) => void;
};

export type LocalTrackDevices<TrackSource extends Track.Source.Camera | Track.Source.Microphone> = {
  kind: TrackSource extends Track.Source.Camera ? "videoinput" : "audioinput";
  activeId: string;
  changeActive: (deviceId: string, options?: SetMediaDeviceOptions) => Promise<void>;
  list: Array<MediaDeviceInfo>;
};

type LocalTrackCommon<TrackSource extends Track.Source> = {
  [Symbol.toStringTag]: "LocalTrackInstance";

  /** The type of track represented (ie, camera, microphone, screen share, etc) */
  source: TrackSource;

  /** Is the track currently enabled? */
  enabled: boolean;

  /** Is the track currently in the midst of being enabled or disabled? */
  pending: boolean;

  /** Returns a promise which resolves once the track is no longer pending. */
  waitUntilNotPending: (signal?: AbortSignal) => void;

  setEnabled: (enabled: boolean, captureOptions?: CaptureOptions<TrackSource>, publishOptions?: TrackPublishOptions) => Promise<boolean>;
  toggleEnabled: (captureOptions?: CaptureOptions<TrackSource>, publishOptions?: TrackPublishOptions) => Promise<boolean>;

  attachToMediaElement: (element: TrackSource extends Track.Source.Microphone | Track.Source.ScreenShareAudio ? HTMLAudioElement : HTMLVideoElement) => () => void;

  subtle: {
    emitter: TypedEventEmitter<LocalTrackCallbacks<TrackSource>>,
    publication: TrackPublication | null,
    userChoices: LocalUserChoices,
  };
};

type LocalTrackCameraExtraFields = {
  devices: LocalTrackDevices<Track.Source.Camera>;

  dimensions: Track.Dimensions | null;
  orientation: 'landscape' | 'portrait' | null;
};

type LocalTrackMicrophoneExtraFields = {
  devices: LocalTrackDevices<Track.Source.Microphone>;
};

export type LocalTrackInstance<TrackSource extends Track.Source> = LocalTrackCommon<TrackSource> & (
  | (TrackSource extends Track.Source.Camera ? LocalTrackCameraExtraFields : never)
  | (TrackSource extends Track.Source.Microphone ? LocalTrackMicrophoneExtraFields : never)
);

type RecursivelySetValuesToNull<Value> = {
  [K in keyof Value]: Value[K] extends { [key: string]: unknown } | Array<unknown> ? RecursivelySetValuesToNull<Value[K]> : null;
};

export type LocalTrackPlaceholder<TrackSource extends Track.Source> = Omit<
  RecursivelySetValuesToNull<LocalTrackInstance<TrackSource>>,
  'source' | 'devices'
> & {
  source: TrackSource;
  devices: LocalTrackInstance<TrackSource>['devices'];
};

export type LocalTrackInstanceOrPlaceholder<TrackRef extends TrackReferenceOrPlaceholder> =
  | (TrackRef extends TrackReference<infer TrackSource, LocalParticipant> ? LocalTrackInstance<TrackSource> : never)
  | (TrackRef extends TrackReferencePlaceholder<infer TrackSource, LocalParticipant> ? LocalTrackPlaceholder<TrackSource> : never);

export function useLocalTrack<LocalTrackRef extends TrackReferenceOrPlaceholder<Track.Source, LocalParticipant>>(
  localTrack: LocalTrackRef,
  options?: {
    room: Room;
    preventUserChoicesSave: boolean;
    /* requestPermissions maybe here? */
  },
): LocalTrackInstanceOrPlaceholder<LocalTrackRef> {
  const room = useEnsureRoom(options?.room!);
  
  const emitter = new EventEmitter() as TypedEventEmitter<LocalTrackCallbacks<LocalTrackRef['source']>>;

  const {
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant({ room });

  const publicationLocalTrack = useMemo(() => {
    switch (localTrack.source) {
      case Track.Source.Camera:
        return (localTrack.publication?.videoTrack ?? null) as LocalVideoTrack | null;
      case Track.Source.Microphone:
        return (localTrack.publication?.audioTrack ?? null) as LocalAudioTrack | null;
      default:
        return null;
    }
  }, [localTrack.source, localTrack.publication]);

  const enabled = useMemo(() => {
    switch (localTrack.source) {
      case Track.Source.Camera:
        return isCameraEnabled;
      case Track.Source.Microphone:
        return isMicrophoneEnabled;
      case Track.Source.ScreenShare:
        return isScreenShareEnabled;
      default:
        throw new Error(`useLocalTrack - Unable to handle getting enabled for track source ${localTrack.source}.`);
    }
  }, [localTrack.source, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled]);

  const orientation = useMemo(() => {
    // Set the orientation of the video track.
    // TODO: This does not handle changes in orientation after a track got published (e.g when rotating a phone camera from portrait to landscape).
    if (
      typeof localTrack.publication?.dimensions?.width === 'number' &&
      typeof localTrack.publication?.dimensions?.height === 'number'
    ) {
      return localTrack.publication.dimensions.width > localTrack.publication.dimensions.height ? 'landscape' as const : 'portrait' as const;
    }

    return null;
  }, [localTrack.publication]);

  const dimensions = localTrack.publication?.dimensions ?? null;

  const {
    devices,
    activeDeviceId,
    setActiveMediaDevice,
  } = useMediaDeviceSelect({
    kind: localTrack.source === Track.Source.Camera ? "videoinput" : "audioinput",
    room,
    track: publicationLocalTrack ?? undefined,
    /* FIXME: requestPermissions, onError */
  });

  const [userChoices, setUserChoices] = useState<LocalUserChoices>(() => loadUserChoices());
  useEffect(() => {
    saveUserChoices(userChoices, options?.preventUserChoicesSave);
  }, [userChoices])

  const [pending, setPending] = useState(false);
  const waitUntilNotPending = useCallback(async (signal?: AbortSignal) => {
    if (!pending) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const onceEventOccurred = () => {
        cleanup();
        resolve();
      };
      const abortHandler = () => {
        cleanup();
        reject(new Error(`LocalTrackEvent.waitUntilNotPending - signal aborted`));
      };

      const cleanup = () => {
        emitter.off(LocalTrackEvent.PendingDisabled, onceEventOccurred);
        signal?.removeEventListener('abort', abortHandler);
      };

      emitter.on(LocalTrackEvent.PendingDisabled, onceEventOccurred);
      signal?.addEventListener('abort', abortHandler);
    });
  }, [pending]);

  const setEnabled = useCallback(async (
    enabled: boolean,
    captureOptions?: CaptureOptions<LocalTrackRef['source']>,
    publishOptions?: TrackPublishOptions,
  ) => {
    await waitUntilNotPending();
    setPending(true);

    let setEnabledPromise;
    let getterKey;
    switch (localTrack.source) {
      case Track.Source.Camera:
        setEnabledPromise = room.localParticipant.setCameraEnabled(
          enabled,
          captureOptions as CaptureOptions<Track.Source.Camera>,
          publishOptions,
        );
        getterKey = 'isCameraEnabled' as const;
        break;
      case Track.Source.Microphone:
        setEnabledPromise = room.localParticipant.setMicrophoneEnabled(
          enabled,
          captureOptions as CaptureOptions<Track.Source.Microphone>,
          publishOptions,
        );
        getterKey = 'isMicrophoneEnabled' as const;
        break;
      case Track.Source.ScreenShare:
        setEnabledPromise = room.localParticipant.setScreenShareEnabled(
          enabled,
          captureOptions as CaptureOptions<Track.Source.ScreenShare>,
          publishOptions,
        );
        getterKey = 'isScreenShareEnabled' as const;
        break;
      default:
        throw new Error(`LocalTrackInstance.setEnabled - Unable to handle enabling track source ${localTrack.source}.`);
    }

    try {
      await setEnabledPromise;
    } catch (err) {
      if (err instanceof Error) {
        emitter.emit(LocalTrackEvent.DeviceError, err, localTrack.source);
      }
      throw err;
    } finally {
      setPending(false);
    }

    switch (localTrack.source) {
      case Track.Source.Camera:
        setUserChoices((old) => ({ ...old, videoEnabled: enabled }));
        break;
      case Track.Source.Microphone:
        setUserChoices((old) => ({ ...old, audioEnabled: enabled }));
        break;
    }

    emitter.emit(LocalTrackEvent.PendingDisabled);
    return room.localParticipant[getterKey];
  }, [waitUntilNotPending, localTrack, emitter, room.localParticipant]);

  const toggleEnabled = useCallback(async (captureOptions?: CaptureOptions<LocalTrackRef['source']>, publishOptions?: TrackPublishOptions) => {
    return setEnabled(!enabled, captureOptions, publishOptions);
  }, [enabled]);

  const attachToMediaElement = useCallback((element: HTMLMediaElement) => {
    const track = localTrack.publication?.track;
    if (!track) {
      throw new Error('useLocalTrack.attachToMediaElement - track publication not set');
    }

    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [localTrack.publication]);

  return useMemo(() => {
    if (!localTrack.publication) {
      const common = {
        [Symbol.toStringTag]: "LocalTrackInstance",

        source: localTrack.source,
        enabled: null,
        pending: null,
        waitUntilNotPending: null,

        setEnabled: null,
        toggleEnabled: null,

        attachToMediaElement: null,

        subtle: {
          emitter,
          publication: null,
          userChoices,
        },
      };

      switch (localTrack.source) {
        case Track.Source.Camera:
          return {
            ...common,

            devices: {
              kind: "videoinput",
              activeId: activeDeviceId,
              changeActive: setActiveMediaDevice,
              list: devices,
            },

            dimensions,
            orientation,
          };

        case Track.Source.Microphone:
          return {
            ...common,

            devices: {
              kind: "audioinput",
              activeId: activeDeviceId,
              changeActive: setActiveMediaDevice,
              list: devices,
            },
          };

        case Track.Source.ScreenShare:
        case Track.Source.ScreenShareAudio:
        case Track.Source.Unknown:
          return common;
      }
    }

    const common: LocalTrackCommon<LocalTrackRef['source']> = {
      [Symbol.toStringTag]: "LocalTrackInstance",

      source: localTrack.source,
      enabled,
      pending,
      waitUntilNotPending,

      setEnabled,
      toggleEnabled,

      attachToMediaElement,

      subtle: {
        emitter,
        publication: localTrack.publication,
        userChoices,
      },
    };

    switch (localTrack.source) {
      case Track.Source.Camera:
        return {
          ...(common as LocalTrackCommon<Track.Source.Camera>),

          devices: {
            kind: "videoinput",
            activeId: activeDeviceId,
            changeActive: setActiveMediaDevice,
            list: devices,
          },

          dimensions,
          orientation,
        } satisfies LocalTrackCameraExtraFields;

      case Track.Source.Microphone:
        return {
          ...(common as LocalTrackCommon<Track.Source.Microphone>),

          devices: {
            kind: "audioinput",
            activeId: activeDeviceId,
            changeActive: setActiveMediaDevice,
            list: devices,
          },
        } satisfies LocalTrackMicrophoneExtraFields;

      case Track.Source.ScreenShare:
      case Track.Source.ScreenShareAudio:
      case Track.Source.Unknown:
        return common;
    }
  }, [
    localTrack.source,
    localTrack.publication,
    enabled,
    pending,
    waitUntilNotPending,
    setEnabled,
    toggleEnabled,
    activeDeviceId,
    setActiveMediaDevice,
    devices,
    attachToMediaElement,
    dimensions,
    orientation,
    emitter,
    userChoices,
  ]) as LocalTrackInstanceOrPlaceholder<LocalTrackRef>;
}
