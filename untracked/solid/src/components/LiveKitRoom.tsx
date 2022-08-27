import {
  AudioCaptureOptions,
  AudioTrack,
  ConnectionState,
  Participant,
  Room,
  RoomConnectOptions,
  RoomEvent,
  RoomOptions,
  ScreenShareCaptureOptions,
  VideoCaptureOptions,
} from 'livekit-client';
import { noShadowDOM } from 'solid-element';
import { createContext, useContext, createEffect, createSignal, onCleanup } from 'solid-js';

export type LiveKitRoomProps = {
  children?: any;
  token: string;
  url: string;
  options?: RoomOptions;
  connectOptions?: RoomConnectOptions;
  audio?: AudioCaptureOptions | boolean;
  video?: VideoCaptureOptions | boolean;
  screen?: ScreenShareCaptureOptions | boolean;
  connect?: boolean;
};

type RoomContextState = {
  room: Room;
  connectionState: ConnectionState;
  participants: Participant[];
  audioTracks: AudioTrack[];
};

const RoomContext = createContext<RoomContextState>({
  room: new Room(),
  connectionState: ConnectionState.Disconnected,
  audioTracks: [],
  participants: [],
});

export function useRoom() {
  return useContext(RoomContext);
}

export const LiveKitRoom = (props: LiveKitRoomProps) => {
  noShadowDOM();
  const connect = () => props.connect || false;
  const [room] = createSignal<Room>(new Room(props.options));
  const [roomState, setRoomState] = createSignal<RoomContextState>({
    room: room(),
    connectionState: ConnectionState.Disconnected,
    audioTracks: [],
    participants: [],
  });

  const getAudioTracks = () => {
    const tracks: AudioTrack[] = [];
    room().participants.forEach((p) => {
      p.audioTracks.forEach((pub) => {
        if (pub.audioTrack) {
          tracks.push(pub.audioTrack);
        }
      });
    });
    return tracks;
  };

  const handleRoomUpdate = () => {
    setRoomState({
      room: room(),
      connectionState: room().state,
      audioTracks: getAudioTracks(),
      participants: [room().localParticipant, ...Array.from(room().participants.values())],
    });
  };
  createEffect(() => {
    const currentRoom = room();
    currentRoom.on(RoomEvent.ParticipantConnected, handleRoomUpdate);
    currentRoom.on(RoomEvent.ParticipantDisconnected, handleRoomUpdate);
    currentRoom.on(RoomEvent.RoomMetadataChanged, handleRoomUpdate);
    currentRoom.on(RoomEvent.ConnectionStateChanged, handleRoomUpdate);
    currentRoom.on(RoomEvent.TrackSubscribed, handleRoomUpdate);
    currentRoom.on(RoomEvent.TrackUnsubscribed, handleRoomUpdate);
    currentRoom.on(RoomEvent.LocalTrackPublished, handleRoomUpdate);
    currentRoom.on(RoomEvent.LocalTrackUnpublished, handleRoomUpdate);
    onCleanup(() => {
      currentRoom.off(RoomEvent.ParticipantConnected, handleRoomUpdate);
      currentRoom.off(RoomEvent.ParticipantDisconnected, handleRoomUpdate);
      currentRoom.off(RoomEvent.RoomMetadataChanged, handleRoomUpdate);
      currentRoom.off(RoomEvent.ConnectionStateChanged, handleRoomUpdate);
      currentRoom.off(RoomEvent.TrackSubscribed, handleRoomUpdate);
      currentRoom.off(RoomEvent.TrackUnsubscribed, handleRoomUpdate);
      currentRoom.off(RoomEvent.LocalTrackPublished, handleRoomUpdate);
      currentRoom.off(RoomEvent.LocalTrackUnpublished, handleRoomUpdate);
    });
  });
  console.log('rendering room provider');

  createEffect(() => {
    if (roomState().connectionState !== ConnectionState.Connected) {
      return;
    }
    const localP = roomState().room.localParticipant;
    localP.setMicrophoneEnabled(
      !!props.audio,
      typeof props.audio !== 'boolean' ? props.audio : undefined,
    );
    localP.setCameraEnabled(
      !!props.video,
      typeof props.video !== 'boolean' ? props.video : undefined,
    );
    localP.setScreenShareEnabled(
      !!screen,
      typeof props.screen !== 'boolean' ? props.screen : undefined,
    );
  });
  createEffect(() => {
    console.log('running createEffect');
    if (connect()) {
      console.log('trying to connect');
      roomState()
        .room.connect(props.url, props.token, props.connectOptions)
        .catch((e: unknown) => {
          console.warn('could not connect', e);
        });
    } else {
      roomState().room.disconnect();
    }
  });

  return (
    <RoomContext.Provider value={roomState()}>
      <p>my room</p>
      {roomState().connectionState === ConnectionState.Connected && props.children}
    </RoomContext.Provider>
  );
};
