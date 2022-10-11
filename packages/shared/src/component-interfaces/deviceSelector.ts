import { ClassNames } from '@livekit/components-styles/dist/types/general/styles.css';
import { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
import { concatMap, map, share } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { createMediaDeviceObserver } from '../observables/room';

export function setupDeviceSelector(kind: MediaDeviceKind, room: Room) {
  const activeDeviceObservable = observeParticipantMedia(room.localParticipant).pipe(
    map(async (participantMedia) => {
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
      return await localTrack?.getDeviceId();
    }),
    concatMap((deviceId) => {
      return deviceId;
    }),
  );

  const devicesObservable = createMediaDeviceObserver(kind).pipe(share());

  const className: ClassNames = 'lk-device-selector';
  return {
    className,
    devicesObservable,
    activeDeviceObservable,
  };
}
