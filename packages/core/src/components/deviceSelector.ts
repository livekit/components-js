import { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
import { BehaviorSubject, map, mergeWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { lkClassName } from '../utils';

export function setupDeviceSelector(kind: MediaDeviceKind, room?: Room) {
  const activeDeviceSubject = new BehaviorSubject<string | undefined>(undefined);

  const activeDeviceObservable = room
    ? observeParticipantMedia(room.localParticipant).pipe(
        map((participantMedia) => {
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
        mergeWith(activeDeviceSubject),
      )
    : activeDeviceSubject.asObservable();

  const setActiveMediaDevice = async (kind: MediaDeviceKind, id: string) => {
    if (room) {
      await room?.switchActiveDevice(kind, id);
    }
    activeDeviceSubject.next(id);
  };
  const className: string = lkClassName('device-selector');
  return {
    className,
    activeDeviceObservable,
    setActiveMediaDevice,
  };
}
