import { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
import Observable from 'zen-observable';
import { merge } from 'zen-observable/extras';
import log from '../logger';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';

export function setupDeviceSelector(kind: MediaDeviceKind, room?: Room) {
  let activeDeviceSubscriptionObserver: ZenObservable.SubscriptionObserver<string | undefined>;
  const manualObservable = new Observable<string | undefined>((subscribe) => {
    activeDeviceSubscriptionObserver = subscribe;
  });
  const activeDeviceObservable = room
    ? merge(
        observeParticipantMedia(room.localParticipant).map((participantMedia) => {
          let localTrack: LocalAudioTrack | LocalVideoTrack | undefined;
          switch (kind) {
            case 'videoinput':
              localTrack = participantMedia.cameraTrack?.track as LocalAudioTrack;
              break;
            case 'audioinput':
              localTrack = participantMedia.microphoneTrack?.track as LocalVideoTrack;
              break;
            default:
              localTrack = undefined;
              break;
          }
          return localTrack?.mediaStreamTrack.getSettings()?.deviceId;
        }),
        manualObservable,
      )
    : manualObservable;

  const setActiveMediaDevice = async (id: string) => {
    if (room) {
      log.debug('switching device', kind, id);
      await room.switchActiveDevice(kind, id);
    } else {
      log.debug('room not available, skipping device switch');
    }
    activeDeviceSubscriptionObserver.next(id);
  };
  const className: string = prefixClass('media-device-select');
  return {
    className,
    activeDeviceObservable,
    setActiveMediaDevice,
  };
}
