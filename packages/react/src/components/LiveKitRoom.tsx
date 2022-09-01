import { roomEventSelector } from '@livekit/components-core';
import {
  AudioCaptureOptions,
  ConnectionState,
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
  token?: string;
  options?: RoomOptions;
  connectOptions?: RoomConnectOptions;
  audio?: AudioCaptureOptions | boolean;
  video?: VideoCaptureOptions | boolean;
  screen?: ScreenShareCaptureOptions | boolean;
  connect?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
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

export function useMaybeRoomContext() {
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
  onConnected,
  onDisconnected,
  onError,
}: LiveKitRoomProps) => {
  const [room] = useState<Room>(new Room(options));
  // setLogLevel('debug');

  useEffect(() => {
    if (room.state !== ConnectionState.Connected) {
      return;
    }
    const localP = room.localParticipant;
    try {
      localP.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined);
      localP.setCameraEnabled(!!video, typeof video !== 'boolean' ? video : undefined);
      localP.setScreenShareEnabled(!!screen, typeof screen !== 'boolean' ? screen : undefined);
    } catch (e: any) {
      console.warn(e);
      onError?.(e as Error);
    }
  }, [room.state, audio, video, screen]);

  useEffect(() => {
    if (!token) return;
    if (!process.env.NEXT_PUBLIC_LK_SERVER_URL) {
      console.warn('no livekit url provided');
      onError?.(Error('no livekit url provided'));
      return;
    }
    if (connect) {
      room.connect(process.env.NEXT_PUBLIC_LK_SERVER_URL, token, connectOptions).catch((e: any) => {
        console.warn(e);
        onError?.(e as Error);
      });
    } else {
      room.disconnect();
    }
  }, [connect, token]);

  useEffect(() => {
    const connectionStateChangeListener = roomEventSelector(
      room,
      RoomEvent.ConnectionStateChanged,
    ).subscribe(([state]) => {
      switch (state) {
        case ConnectionState.Disconnected:
          if (onDisconnected) onDisconnected();
          break;
        case ConnectionState.Connected:
          if (onConnected) onConnected();
          break;

        default:
          break;
      }
    });
    return () => connectionStateChangeListener.unsubscribe();
  }, [token]);

  return <RoomContext.Provider value={room}>{children}</RoomContext.Provider>;
};
