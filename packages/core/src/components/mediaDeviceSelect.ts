import type { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
import { Track } from 'livekit-client';
import { BehaviorSubject, map, mergeWith } from 'rxjs';
import { log } from '../logger';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';

export type SetMediaDeviceOptions = {
  /**
   *  If true, adds an `exact` constraint to the getUserMedia request.
   *  The request will fail if this option is true and the device specified is not actually available
   */
  exact?: boolean;
};

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

  const setActiveMediaDevice = async (id: string, options: SetMediaDeviceOptions = {}) => {
    if (room) {
      log.debug(`Switching active device of kind "${kind}" with id ${id}.`);
      await room.switchActiveDevice(kind, id, options.exact);
      let actualDeviceId: string | undefined = id;
      if (kind === 'videoinput') {
        actualDeviceId = await room.localParticipant
          .getTrack(Track.Source.Camera)
          ?.track?.getDeviceId();
      } else if (kind === 'audioinput') {
        actualDeviceId = await room.localParticipant
          .getTrack(Track.Source.Microphone)
          ?.track?.getDeviceId();
      }
      if (actualDeviceId !== id && id !== 'default') {
        log.warn(`Failed to select the desired device. Desired: ${id}. Actual: ${actualDeviceId}`);
      }
      activeDeviceSubject.next(id === 'default' ? id : actualDeviceId);
    } else {
      log.debug('Skip the device switch because the room object is not available. ');
      activeDeviceSubject.next(id);
    }
  };
  const className: string = prefixClass('media-device-select');
  return {
    className,
    activeDeviceObservable,
    setActiveMediaDevice,
  };
}
