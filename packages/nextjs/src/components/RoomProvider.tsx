import React, { ReactNode, useContext, useEffect, useState } from 'react';
// import { useParticipant as useParticipantHook } from '@livekit/react-core';
import {
  AudioTrack,
  ConnectionState,
  Participant,
  Room,
  RoomEvent,
  setLogLevel,
} from 'livekit-client';

type RoomProviderProps = {
  children: Array<ReactNode> | ReactNode;
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

// export function useParticipants() {
//   return useContext(RoomContext)?.participants;
// }

// export function useParticipant(identity: string) {
//   const participant = useContext(RoomContext).getParticipantByIdentity(identity);
//   return participant ? useParticipantHook(participant) : undefined;
// }

export const RoomProvider = ({ children }: RoomProviderProps) => {
  setLogLevel('debug');
  const [room] = useState<Room>(new Room());
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
  return <RoomContext.Provider value={roomState}>{children}</RoomContext.Provider>;
};
