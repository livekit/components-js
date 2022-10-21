import { ClassNames } from '@livekit/components-styles/dist/types/general/styles.css';
import { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
import { BehaviorSubject, map, merge, mergeWith, share } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { createMediaDeviceObserver } from '../observables/room';
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
          console.log(
            'active device changed',
            localTrack?.mediaStreamTrack.getSettings()?.deviceId,
          );
          return localTrack?.mediaStreamTrack.getSettings()?.deviceId;
        }),
        mergeWith(activeDeviceSubject),
      )
    : activeDeviceSubject.asObservable();

  console.log('active device observable', { activeDeviceObservable });
  const devicesObservable = createMediaDeviceObserver(kind).pipe(share());

  const setActiveMediaDevice = async (kind: MediaDeviceKind, id: string) => {
    if (room) {
      await room?.switchActiveDevice(kind, id);
    }
    activeDeviceSubject.next(id);
  };
  const className: ClassNames = lkClassName('device-selector');
  return {
    className,
    devicesObservable,
    activeDeviceObservable,
    setActiveMediaDevice,
  };
}
