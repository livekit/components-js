import { LocalParticipant, Room, Track } from 'livekit-client';
import { BehaviorSubject, map, startWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { lkClassName } from '../utils';

export function setupMediaToggle(source: Track.Source, room: Room) {
  const { localParticipant } = room;

  const getSourceEnabled = (source: Track.Source, localParticipant: LocalParticipant) => {
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

  const pendingSubject = new BehaviorSubject(false);
  const toggle = async (forceState?: boolean) => {
    try {
      // trigger observable update
      pendingSubject.next(true);
      switch (source) {
        case Track.Source.Camera:
          await localParticipant.setCameraEnabled(forceState ?? !localParticipant.isCameraEnabled);
          break;
        case Track.Source.Microphone:
          await localParticipant.setMicrophoneEnabled(
            forceState ?? !localParticipant.isMicrophoneEnabled,
          );
          break;
        case Track.Source.ScreenShare:
          await localParticipant.setScreenShareEnabled(
            forceState ?? !localParticipant.isScreenShareEnabled,
          );
          break;
        default:
          break;
      }
    } finally {
      pendingSubject.next(false);
      // trigger observable update
    }
  };

  const className: string = lkClassName('button');
  return { className, toggle, enabledObserver, pendingObserver: pendingSubject.asObservable() };
}

export function setupManualToggle() {
  let state = false;

  const enabledSubject = new BehaviorSubject(state);

  const pendingSubject = new BehaviorSubject(false);

  const toggle = (forceState?: boolean) => {
    pendingSubject.next(true);
    state = forceState ?? !state;
    enabledSubject.next(state);
    pendingSubject.next(false);
  };
  const className: string = lkClassName('button');
  return {
    className,
    toggle,
    enabledObserver: enabledSubject.asObservable(),
    pendingObserver: pendingSubject.asObservable(),
  };
}
