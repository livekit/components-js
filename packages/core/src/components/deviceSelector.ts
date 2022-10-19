import { ClassNames } from '@livekit/components-styles/dist/types/general/styles.css';
import { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
import { map, share } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { createMediaDeviceObserver } from '../observables/room';
import { lkClassName } from '../utils';

export function setupDeviceSelector(kind: MediaDeviceKind, room?: Room) {
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
      )
    : undefined;

  const devicesObservable = createMediaDeviceObserver(kind).pipe(share());

  const className: ClassNames = lkClassName('device-selector');
  return {
    className,
    devicesObservable,
    activeDeviceObservable,
  };
}
