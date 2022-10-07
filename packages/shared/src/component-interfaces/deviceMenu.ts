import { Room, Track } from 'livekit-client';
import { map, Observable, share, Subscriber } from 'rxjs';
import { createMediaDeviceObserver } from '../observables/room';
import { lkClassName } from '../utils';

export function setupDeviceMenu(kind: MediaDeviceKind, room?: Room) {
  const devicesObservable = createMediaDeviceObserver(kind).pipe(share());
  let activeDeviceSubscriber: Subscriber<MediaDeviceInfo> | undefined;
  const activeDeviceObservable = new Observable<MediaDeviceInfo>((subscriber) => {
    activeDeviceSubscriber = subscriber;
  });
  const listElementObservable = devicesObservable.pipe(
    map((deviceInfos) => {
      const ul = constructList(
        deviceInfos,
        kind,
        (info) => activeDeviceSubscriber?.next(info),
        room,
      );
      return ul;
    }),
  );
  const className = lkClassName('device-menu');
  return { className, devicesObservable, activeDeviceObservable, listElementObservable };
}

function constructList(
  devices: MediaDeviceInfo[],
  kind: MediaDeviceKind,
  onChange?: (info: MediaDeviceInfo) => void,
  room?: Room,
) {
  const publication = room?.localParticipant.getTrack(
    kind === 'videoinput' ? Track.Source.Camera : Track.Source.Microphone,
  );
  const activeId = publication?.track?.mediaStreamTrack.getSettings().deviceId;
  const ul = document.createElement('ul');
  ul.className = 'lk-device-list';
  devices.forEach((device) => {
    const li = document.createElement('li');
    li.id = device.deviceId;
    li.innerText = device.label;
    li.className = 'lk-device-list-item';
    if (device.deviceId === activeId) {
      li.classList.add('lk-active');
    }
    li.onclick = async () => {
      console.log('switch device');
      await room?.switchActiveDevice(kind, device.deviceId);
      ul.querySelectorAll(`li`)?.forEach((el) => el.classList.remove('lk-active'));
      li.classList.add('lk-active');
      onChange?.(device);
    };
    ul.append(li);
  });
  return ul;
}
