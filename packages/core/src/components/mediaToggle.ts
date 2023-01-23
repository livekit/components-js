import { LocalParticipant, Room, Track } from 'livekit-client';
import Observable from 'zen-observable';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';

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

  const enabledObserver = Observable.of(getSourceEnabled(source, localParticipant)).concat(
    observeParticipantMedia(localParticipant).map((media) => {
      return getSourceEnabled(source, media.participant as LocalParticipant);
    }),
  );

  let pendingSubscriptionObserver: ZenObservable.SubscriptionObserver<boolean>;
  const pendingObservable = Observable.of(false).concat(
    new Observable<boolean>((subscribe) => {
      pendingSubscriptionObserver = subscribe;
    }),
  );
  const toggle = async (forceState?: boolean) => {
    try {
      // trigger observable update
      pendingSubscriptionObserver.next(true);
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
      pendingSubscriptionObserver.next(false);
      // trigger observable update
    }
  };

  const className: string = prefixClass('button');
  return { className, toggle, enabledObserver, pendingObserver: pendingObservable };
}

export function setupManualToggle() {
  let state = false;

  let enabledSubscriptionObserver: ZenObservable.SubscriptionObserver<boolean>;
  const enabledObservable = Observable.of(false).concat(
    new Observable<boolean>((subscribe) => {
      pendingSubscriptionObserver = subscribe;
    }),
  );
  let pendingSubscriptionObserver: ZenObservable.SubscriptionObserver<boolean>;
  const pendingObservable = Observable.of(false).concat(
    new Observable<boolean>((subscribe) => {
      pendingSubscriptionObserver = subscribe;
    }),
  );
  const toggle = (forceState?: boolean) => {
    pendingSubscriptionObserver.next(true);
    state = forceState ?? !state;
    enabledSubscriptionObserver.next(state);
    pendingSubscriptionObserver.next(false);
  };
  const className: string = prefixClass('button');
  return {
    className,
    toggle,
    enabledObserver: enabledObservable,
    pendingObserver: pendingObservable,
  };
}
