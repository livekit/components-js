import type {
  AudioCaptureOptions,
  LocalParticipant,
  Room,
  ScreenShareCaptureOptions,
  TrackPublishOptions,
  VideoCaptureOptions,
} from 'livekit-client';
import { Track } from 'livekit-client';
import type { Observable } from 'rxjs';
import { Subject, map, startWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';

export type CaptureOptionsBySource<T extends ToggleSource> = T extends Track.Source.Camera
  ? VideoCaptureOptions
  : T extends Track.Source.Microphone
    ? AudioCaptureOptions
    : T extends Track.Source.ScreenShare
      ? ScreenShareCaptureOptions
      : never;

export type MediaToggleType<T extends ToggleSource> = {
  pendingObserver: Observable<boolean>;
  toggle: (
    forceState?: boolean,
    captureOptions?: CaptureOptionsBySource<T>,
  ) => Promise<boolean | undefined>;
  className: string;
  enabledObserver: Observable<boolean>;
};

export type ToggleSource = Exclude<
  Track.Source,
  Track.Source.ScreenShareAudio | Track.Source.Unknown
>;

export function setupMediaToggle<T extends ToggleSource>(
  source: T,
  room: Room,
  options?: CaptureOptionsBySource<T>,
  publishOptions?: TrackPublishOptions,
  onError?: (error: Error) => void,
): MediaToggleType<T> {
  const { localParticipant } = room;

  const getSourceEnabled = (source: ToggleSource, localParticipant: LocalParticipant) => {
    let isEnabled = false;
    switch (source) {
      case Track.Source.Camera:
        isEnabled = localParticipant.isCameraEnabled;
        break;
      case Track.Source.Microphone:
        isEnabled = localParticipant.isMicrophoneEnabled;
        break;
      case Track.Source.ScreenShare:
        isEnabled = localParticipant.isScreenShareEnabled;
        break;
      default:
        break;
    }
    return isEnabled;
  };

  const enabledObserver = observeParticipantMedia(localParticipant).pipe(
    map((media) => {
      return getSourceEnabled(source, media.participant as LocalParticipant);
    }),
    startWith(getSourceEnabled(source, localParticipant)),
  );

  const pendingSubject = new Subject<boolean>();
  const toggle = async (forceState?: boolean, captureOptions?: CaptureOptionsBySource<T>) => {
    try {
      captureOptions ??= options;
      // trigger observable update
      pendingSubject.next(true);
      switch (source) {
        case Track.Source.Camera:
          await localParticipant.setCameraEnabled(
            forceState ?? !localParticipant.isCameraEnabled,
            captureOptions as VideoCaptureOptions,
            publishOptions,
          );
          return localParticipant.isCameraEnabled;
        case Track.Source.Microphone:
          await localParticipant.setMicrophoneEnabled(
            forceState ?? !localParticipant.isMicrophoneEnabled,
            captureOptions as AudioCaptureOptions,
            publishOptions,
          );
          return localParticipant.isMicrophoneEnabled;
        case Track.Source.ScreenShare:
          await localParticipant.setScreenShareEnabled(
            forceState ?? !localParticipant.isScreenShareEnabled,
            captureOptions as ScreenShareCaptureOptions,
            publishOptions,
          );
          return localParticipant.isScreenShareEnabled;
        default:
          throw new TypeError('Tried to toggle unsupported source');
      }
    } catch (e) {
      if (onError && e instanceof Error) {
        onError?.(e);
        return undefined;
      } else {
        throw e;
      }
    } finally {
      pendingSubject.next(false);
      // trigger observable update
    }
  };

  const className: string = prefixClass('button');
  return {
    className,
    toggle,
    enabledObserver,
    pendingObserver: pendingSubject.asObservable(),
  };
}

export function setupManualToggle() {
  let state = false;

  const enabledSubject = new Subject<boolean>();

  const pendingSubject = new Subject<boolean>();

  const toggle = async (forceState?: boolean) => {
    pendingSubject.next(true);
    state = forceState ?? !state;
    enabledSubject.next(state);
    pendingSubject.next(false);
  };
  const className: string = prefixClass('button');
  return {
    className,
    toggle,
    enabledObserver: enabledSubject.asObservable(),
    pendingObserver: pendingSubject.asObservable(),
  };
}
