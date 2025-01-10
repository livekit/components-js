import {
  Track,
  type LocalAudioTrack,
  type LocalVideoTrack,
  type Room,
  type LocalTrack,
} from 'livekit-client';
import { BehaviorSubject } from 'rxjs';
import { log } from '../logger';
import { prefixClass } from '../styles-interface';
import { createActiveDeviceObservable } from '../observables/room';

export type SetMediaDeviceOptions = {
  /**
   *  If true, adds an `exact` constraint to the getUserMedia request.
   *  The request will fail if this option is true and the device specified is not actually available
   */
  exact?: boolean;
};

export function setupDeviceSelector(
  kind: MediaDeviceKind,
  room: Room,
  localTrack?: LocalAudioTrack | LocalVideoTrack,
) {
  const activeDeviceSubject = new BehaviorSubject<string | undefined>(undefined);

  const activeDeviceObservable = createActiveDeviceObservable(room, kind);

  const setActiveMediaDevice = async (id: string, options: SetMediaDeviceOptions = {}) => {
    if (localTrack) {
      await localTrack.setDeviceId(options.exact ? { exact: id } : id);
      const actualId = await localTrack.getDeviceId(false);
      activeDeviceSubject.next(
        id === 'default' && localTrack.mediaStreamTrack.label.startsWith('Default') ? id : actualId,
      );
    } else if (room) {
      log.debug(`Switching active device of kind "${kind}" with id ${id}.`);
      await room.switchActiveDevice(kind, id, options.exact);
      const actualDeviceId: string | undefined = room.getActiveDevice(kind) ?? id;
      if (actualDeviceId !== id && id !== 'default') {
        log.info(
          `We tried to select the device with id (${id}), but the browser decided to select the device with id (${actualDeviceId}) instead.`,
        );
      }
      let targetTrack: LocalTrack | undefined = undefined;
      if (kind === 'audioinput')
        targetTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
      else if (kind === 'videoinput') {
        targetTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
      }
      const useDefault =
        (id === 'default' && !targetTrack) ||
        (id === 'default' && targetTrack?.mediaStreamTrack.label.startsWith('Default'));
      activeDeviceSubject.next(useDefault ? id : actualDeviceId);
    }
  };
  const className: string = prefixClass('media-device-select');
  return {
    className,
    activeDeviceObservable,
    setActiveMediaDevice,
  };
}
