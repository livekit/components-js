import {
  AudioCaptureOptions,
  ConnectionState,
  Room,
  RoomConnectOptions,
  RoomOptions,
  ScreenShareCaptureOptions,
  VideoCaptureOptions,
} from 'livekit-client';
import React, { ReactNode, useContext, useEffect, useState } from 'react';

export type LiveKitRoomProps = {
  children?: ReactNode | ReactNode[];
  token?: string;
  options?: RoomOptions;
  connectOptions?: RoomConnectOptions;
  audio?: AudioCaptureOptions | boolean;
  video?: VideoCaptureOptions | boolean;
  screen?: ScreenShareCaptureOptions | boolean;
  connect?: boolean;
};

// type RoomContextState = {
//   room: Room;
//   connectionState: ConnectionState;
//   participants: Participant[];
//   audioTracks: AudioTrack[];
// };

const RoomContext = React.createContext<Room | undefined>(undefined);

export function useRoomContext() {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw Error('tried to access room context outside of livekit room component');
  }
  return ctx;
}

export function useTryRoomContext() {
  return useContext(RoomContext);
}

export function useToken(roomName: string, identity: string, name?: string, metadata?: string) {
  const [token, setToken] = useState<string | undefined>(undefined);
  useEffect(() => {
    const tokenFetcher = async () => {
      console.log('fetching token');
      const res = await fetch(
        process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT +
          `?roomName=${roomName}&identity=${identity}&name=${name}&metadata=${metadata}`,
      );
      const { accessToken } = await res.json();
      setToken(accessToken);
    };
    tokenFetcher();
  }, [identity, roomName]);
  return token;
}

export const LiveKitRoom = ({
  children,
  token,
  options,
  connectOptions,
  connect,
  audio,
  video,
  screen,
}: LiveKitRoomProps) => {
  const [room] = useState<Room>(new Room(options));

  useEffect(() => {
    if (room.state !== ConnectionState.Connected) {
      return;
    }
    const localP = room.localParticipant;
    localP.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined);
    localP.setCameraEnabled(!!video, typeof video !== 'boolean' ? video : undefined);
    localP.setScreenShareEnabled(!!screen, typeof screen !== 'boolean' ? screen : undefined);
  }, [room.state, audio, video, screen]);

  useEffect(() => {
    if (!token) return;
    if (!process.env.NEXT_PUBLIC_LK_SERVER_URL) {
      console.error('no livekit url provided');
      return;
    }
    if (connect) {
      room
        .connect(process.env.NEXT_PUBLIC_LK_SERVER_URL, token, connectOptions)
        .catch((e: unknown) => {
          console.warn('could not connect', e);
        });
    } else {
      room.disconnect();
    }
  }, [connect, token]);

  return <RoomContext.Provider value={room}>{children}</RoomContext.Provider>;
};
