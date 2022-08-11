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
import React, { ReactNode, useContext, useEffect, useState } from 'react';

export type LiveKitRoomProps = {
  children?: ReactNode | ReactNode[];
  roomName: string;
  userIdentity: string;
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

const RoomContext = React.createContext<RoomContextState>({
  room: new Room(),
  connectionState: ConnectionState.Disconnected,
  audioTracks: [],
  participants: [],
});

export function useRoom() {
  return useContext(RoomContext);
}

export function useToken(roomName: string, identity: string) {
  const [token, setToken] = useState<string | undefined>(undefined);
  useEffect(() => {
    const tokenFetcher = async () => {
      console.log('fetching token');
      const res = await fetch(
        process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT + `?roomName=${roomName}&identity=${identity}`,
      );
      const { accessToken } = await res.json();
      setToken(accessToken);
    };
    tokenFetcher();
  }, [identity, roomName]);
  return token;
}

export const LiveKitRoom = ({
  roomName,
  children,
  userIdentity,
  options,
  connectOptions,
  connect,
  audio,
  video,
  screen,
}: LiveKitRoomProps) => {
  const [room] = useState<Room>(new Room(options));
  const [roomState, setRoomState] = useState<RoomContextState>({
    room: room,
    connectionState: ConnectionState.Disconnected,
    audioTracks: [],
    participants: [],
  });

  const getAudioTracks = () => {
    const tracks: AudioTrack[] = [];
    room.participants.forEach(p => {
      p.audioTracks.forEach(pub => {
        if (pub.audioTrack) {
          tracks.push(pub.audioTrack);
        }
      });
    });
    return tracks;
  };

  const handleRoomUpdate = () => {
    setRoomState({
      room: room,
      connectionState: room.state,
      audioTracks: getAudioTracks(),
      participants: [room.localParticipant, ...Array.from(room.participants.values())],
    });
  };
  useEffect(() => {
    room.on(RoomEvent.ParticipantConnected, handleRoomUpdate);
    room.on(RoomEvent.ParticipantDisconnected, handleRoomUpdate);
    room.on(RoomEvent.RoomMetadataChanged, handleRoomUpdate);
    room.on(RoomEvent.ConnectionStateChanged, handleRoomUpdate);
    room.on(RoomEvent.TrackSubscribed, handleRoomUpdate);
    room.on(RoomEvent.TrackUnsubscribed, handleRoomUpdate);
    room.on(RoomEvent.LocalTrackPublished, handleRoomUpdate);
    room.on(RoomEvent.LocalTrackUnpublished, handleRoomUpdate);
    return () => {
      room.off(RoomEvent.ParticipantConnected, handleRoomUpdate);
      room.off(RoomEvent.ParticipantDisconnected, handleRoomUpdate);
      room.off(RoomEvent.RoomMetadataChanged, handleRoomUpdate);
      room.off(RoomEvent.ConnectionStateChanged, handleRoomUpdate);
      room.off(RoomEvent.TrackSubscribed, handleRoomUpdate);
      room.off(RoomEvent.TrackUnsubscribed, handleRoomUpdate);
      room.off(RoomEvent.LocalTrackPublished, handleRoomUpdate);
      room.off(RoomEvent.LocalTrackUnpublished, handleRoomUpdate);
    };
  });
  console.log('rendering room provider');
  const token = useToken(roomName, userIdentity); // TODO add permissions

  useEffect(() => {
    if (roomState.connectionState !== ConnectionState.Connected) {
      return;
    }
    const localP = roomState.room.localParticipant;
    localP.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined);
    localP.setCameraEnabled(!!video, typeof video !== 'boolean' ? video : undefined);
    localP.setScreenShareEnabled(!!screen, typeof screen !== 'boolean' ? screen : undefined);
  }, [roomState.connectionState, audio, video, screen]);

  useEffect(() => {
    if (!token) return;
    if (!process.env.NEXT_PUBLIC_LK_SERVER_URL) {
      console.error('no livekit url provided');
      return;
    }
    if (connect) {
      roomState.room
        .connect(process.env.NEXT_PUBLIC_LK_SERVER_URL, token, connectOptions)
        .catch((e: unknown) => {
          console.warn('could not connect', e);
        });
    } else {
      roomState.room.disconnect();
    }
  }, [connect, token]);

  return (
    <RoomContext.Provider value={roomState}>
      {roomState.connectionState === ConnectionState.Connected && children}
    </RoomContext.Provider>
  );
};
