import { LocalParticipant, Track } from 'livekit-client';
import { map, Observable, startWith, Subscriber } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';

export function setupToggle() {
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

  const enabledObserver = (source: Track.Source, localParticipant: LocalParticipant) => {
    return observeParticipantMedia(localParticipant).pipe(
      map((media) => {
        return getSourceEnabled(source, media.participant as LocalParticipant);
      }),
      startWith(getSourceEnabled(source, localParticipant)),
    );
  };

  let pendingTrigger: Subscriber<boolean>;

  const pendingObserver = new Observable<boolean>((subscribe) => {
    pendingTrigger = subscribe;
  });

  const toggle = async (source: Track.Source, localParticipant: LocalParticipant) => {
    try {
      // trigger observable update
      pendingTrigger.next(true);
      switch (source) {
        case Track.Source.Camera:
          await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
          break;
        case Track.Source.Microphone:
          await localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled);
          break;
        case Track.Source.ScreenShare:
          await localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled);
          break;
        default:
          break;
      }
    } finally {
      pendingTrigger.next(false);
      // trigger observable update
    }
  };
  return { className: 'lk-button', toggle, observers: { enabledObserver, pendingObserver } };
}
