import type { Participant, TrackPublication } from 'livekit-client';
import { LocalParticipant, Room, RoomEvent, Track } from 'livekit-client';
import type { Subscriber, Subscription } from 'rxjs';
import { concat, filter, finalize, map, Observable, startWith, Subject } from 'rxjs';
// @ts-ignore some module resolutions (other than 'node') choke on this
import type { RoomEventCallbacks } from 'livekit-client/dist/src/room/Room';
import { log } from '../logger';
export function observeRoomEvents(room: Room, ...events: RoomEvent[]): Observable<Room> {
  const observable = new Observable<Room>((subscribe) => {
    const onRoomUpdate = () => {
      subscribe.next(room);
    };

    events.forEach((evt) => {
      room.on(evt, onRoomUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        room.off(evt, onRoomUpdate);
      });
    };
    return unsubscribe;
  }).pipe(startWith(room));

  return observable;
}

export function roomEventSelector<T extends RoomEvent>(room: Room, event: T) {
  const observable = new Observable<Parameters<RoomEventCallbacks[T]>>((subscribe) => {
    const update = (...params: Parameters<RoomEventCallbacks[T]>) => {
      subscribe.next(params);
    };
    room.on(event as keyof RoomEventCallbacks, update);

    const unsubscribe = () => {
      room.off(event as keyof RoomEventCallbacks, update);
    };
    return unsubscribe;
  });

  return observable;
}

export function roomObserver(room: Room) {
  const observable = observeRoomEvents(
    room,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ActiveSpeakersChanged,
    RoomEvent.TrackSubscribed,
    RoomEvent.TrackUnsubscribed,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
    RoomEvent.AudioPlaybackStatusChanged,
    RoomEvent.ConnectionStateChanged,
  );

  return observable;
}

export function connectionStateObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.ConnectionStateChanged).pipe(
    map(([connectionState]) => connectionState),
    startWith(room.state),
  );
}
export type ScreenShareTrackMap = Array<{
  participant: Participant;
  tracks: Array<TrackPublication>;
}>;

export function screenShareObserver(room: Room) {
  let screenShareSubscriber: Subscriber<ScreenShareTrackMap>;
  const observers: Array<Subscription> = [];

  const observable = new Observable<ScreenShareTrackMap>((subscriber) => {
    screenShareSubscriber = subscriber;
    return () => {
      observers.forEach((observer) => {
        observer.unsubscribe();
      });
    };
  });
  const screenShareTracks: ScreenShareTrackMap = [];

  const handleSub = (publication: TrackPublication, participant: Participant) => {
    if (
      publication.source !== Track.Source.ScreenShare &&
      publication.source !== Track.Source.ScreenShareAudio
    ) {
      return;
    }
    let trackMap = screenShareTracks.find((tr) => tr.participant.identity === participant.identity);
    const getScreenShareTracks = (participant: Participant) => {
      return participant
        .getTrackPublications()
        .filter(
          (track) =>
            (track.source === Track.Source.ScreenShare ||
              track.source === Track.Source.ScreenShareAudio) &&
            track.track,
        );
    };
    if (!trackMap) {
      trackMap = {
        participant,
        tracks: getScreenShareTracks(participant),
      };
    } else {
      const index = screenShareTracks.indexOf(trackMap);
      screenShareTracks.splice(index, 1);
      trackMap.tracks = getScreenShareTracks(participant);
    }
    if (trackMap.tracks.length > 0) {
      screenShareTracks.push(trackMap);
    }

    screenShareSubscriber.next(screenShareTracks);
  };
  observers.push(
    roomEventSelector(room, RoomEvent.TrackSubscribed).subscribe(([, ...args]) =>
      handleSub(...args),
    ),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackUnsubscribed).subscribe(([, ...args]) =>
      handleSub(...args),
    ),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.LocalTrackPublished).subscribe((args) => handleSub(...args)),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.LocalTrackUnpublished).subscribe((args) => {
      handleSub(...args);
    }),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackMuted).subscribe((args) => {
      handleSub(...args);
    }),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackUnmuted).subscribe((args) => {
      handleSub(...args);
    }),
  );
  setTimeout(() => {
    // TODO find way to avoid this timeout
    for (const p of room.remoteParticipants.values()) {
      p.getTrackPublications().forEach((track) => {
        handleSub(track, p);
      });
    }
  }, 1);

  return observable;
}

export function roomInfoObserver(room: Room) {
  const observer = observeRoomEvents(
    room,
    RoomEvent.RoomMetadataChanged,
    RoomEvent.ConnectionStateChanged,
  ).pipe(
    map((r) => {
      return { name: r.name, metadata: r.metadata };
    }),
  );
  return observer;
}

export function activeSpeakerObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.ActiveSpeakersChanged).pipe(
    map(([speakers]) => speakers),
  );
}

export function createMediaDeviceObserver(
  kind?: MediaDeviceKind,
  onError?: (e: Error) => void,
  requestPermissions = true,
) {
  const onDeviceChange = async () => {
    try {
      const newDevices = await Room.getLocalDevices(kind, requestPermissions);
      deviceSubject.next(newDevices);
    } catch (e: any) {
      onError?.(e);
    }
  };
  const deviceSubject = new Subject<MediaDeviceInfo[]>();

  const observable = deviceSubject.pipe(
    finalize(() => {
      navigator?.mediaDevices?.removeEventListener('devicechange', onDeviceChange);
    }),
  );

  if (typeof window !== 'undefined') {
    if (!window.isSecureContext) {
      throw new Error(
        `Accessing media devices is available only in secure contexts (HTTPS and localhost), in some or all supporting browsers. See: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices`,
      );
    }
    navigator?.mediaDevices?.addEventListener('devicechange', onDeviceChange);
  }
  // because we rely on an async function, concat the promise to retrieve the initial values with the observable
  return concat(
    Room.getLocalDevices(kind, requestPermissions).catch((e) => {
      onError?.(e);
      return [] as MediaDeviceInfo[];
    }),
    observable,
  );
}

export function createDataObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.DataReceived);
}

export function createChatObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.ChatMessage);
}

export function roomAudioPlaybackAllowedObservable(room: Room) {
  const observable = observeRoomEvents(room, RoomEvent.AudioPlaybackStatusChanged).pipe(
    map((room) => {
      return { canPlayAudio: room.canPlaybackAudio };
    }),
  );
  return observable;
}

export function roomVideoPlaybackAllowedObservable(room: Room) {
  const observable = observeRoomEvents(room, RoomEvent.VideoPlaybackStatusChanged).pipe(
    map((room) => {
      return { canPlayVideo: room.canPlaybackVideo };
    }),
  );
  return observable;
}

export function createActiveDeviceObservable(room: Room, kind: MediaDeviceKind) {
  return roomEventSelector(room, RoomEvent.ActiveDeviceChanged).pipe(
    filter(([kindOfDevice]) => kindOfDevice === kind),
    map(([kind, deviceId]) => {
      log.debug('activeDeviceObservable | RoomEvent.ActiveDeviceChanged', { kind, deviceId });
      return deviceId;
    }),
  );
}

export function encryptionStatusObservable(room: Room, participant: Participant | undefined) {
  return roomEventSelector(room, RoomEvent.ParticipantEncryptionStatusChanged).pipe(
    filter(
      ([, p]) =>
        participant?.identity === p?.identity ||
        (!p && participant?.identity === room.localParticipant.identity),
    ),
    map(([encrypted]) => encrypted),
    startWith(
      participant?.isLocal
        ? (participant as LocalParticipant).isE2EEEnabled
        : !!participant?.isEncrypted,
    ),
  );
}

export function recordingStatusObservable(room: Room) {
  return roomEventSelector(room, RoomEvent.RecordingStatusChanged).pipe(
    map(([recording]) => recording),
    startWith(room.isRecording),
  );
}
