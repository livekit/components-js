import { ClassNames } from '@livekit/components-styles/dist/types/styles.css';
import { LocalAudioTrack, LocalVideoTrack, Room, RoomEvent, Track } from 'livekit-client';
import { concatMap, map, Observable, share, startWith, Subscriber } from 'rxjs';
import { observeTrackEvents } from '../observables';
import { observeParticipantMedia } from '../observables/participant';
import { createMediaDeviceObserver, roomEventSelector } from '../observables/room';

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

  // FIXME
  // @ts-ignore
  const className: ClassNames = 'lk-device-menu';
  return {
    className,
    devicesObservable,
    activeDeviceObservable,
  };
}
