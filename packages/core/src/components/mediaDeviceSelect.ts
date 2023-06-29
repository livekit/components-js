import type { Room } from 'livekit-client';
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

export function setupDeviceSelector(kind: MediaDeviceKind, room?: Room) {
  const activeDeviceSubject = new BehaviorSubject<string | undefined>(undefined);

  const activeDeviceObservable = room
    ? createActiveDeviceObservable(room, kind)
    : activeDeviceSubject.asObservable();

  const setActiveMediaDevice = async (id: string, options: SetMediaDeviceOptions = {}) => {
    if (room) {
      log.debug(`Switching active device of kind "${kind}" with id ${id}.`);
      await room.switchActiveDevice(kind, id, options.exact);
      const actualDeviceId: string | undefined = room.getActiveDevice(kind) ?? id;
      if (actualDeviceId !== id && id !== 'default') {
        log.info(
          `We tried to select the device with id (${id}), but the browser decided to select the device with id (${actualDeviceId}) instead.`,
        );
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
