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
import React, { ReactNode, useEffect, useState } from 'react';
import { RoomContext } from '../contexts';
import { DefaultRoomView } from './layout/DefaultRoomView';

export type LiveKitRoomProps = {
  children?: ReactNode | ReactNode[];
  serverUrl?: string;
  token?: string;
  room?: Room;
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

interface UserInfo {
  identity?: string;
  name?: string;
  metadata?: string;
}

export function useToken(tokenEndpoint: string | undefined, roomName: string, userInfo?: UserInfo) {
  const [token, setToken] = useState<string | undefined>(undefined);
  if (tokenEndpoint === undefined) {
    throw Error('token endpoint needs to be defined');
  }
  useEffect(() => {
    const tokenFetcher = async () => {
      console.log('fetching token');
      const res = await fetch(
        `${tokenEndpoint}?roomName=${roomName}&identity=${userInfo?.identity}&name=${userInfo?.name}&metadata=${userInfo?.metadata}`,
      );
      const { accessToken } = await res.json();
      setToken(accessToken);
    };
    tokenFetcher();
  }, [tokenEndpoint, roomName]);
  return token;
}

const defaultRoomProps: LiveKitRoomProps = {
  connect: true,
  audio: true,
  video: true,
};
export const useLiveKitRoom = (props: LiveKitRoomProps) => {
  const {
    token,
    serverUrl,
    options,
    room: passedRoom,
    connectOptions,
    connect,
    audio,
    video,
    screen,
    onConnected,
    onDisconnected,
    onError,
  } = { ...defaultRoomProps, ...props };
  const [room] = useState<Room>(passedRoom ?? new Room(options));
  // setLogLevel('debug');

  useEffect(() => {
    const onSignalConnected = () => {
      const localP = room.localParticipant;
      try {
        localP.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined);
        localP.setCameraEnabled(!!video, typeof video !== 'boolean' ? video : undefined);
        localP.setScreenShareEnabled(!!screen, typeof screen !== 'boolean' ? screen : undefined);
      } catch (e: any) {
        console.warn(e);
        onError?.(e as Error);
      }
    };
    room.on(RoomEvent.SignalConnected, onSignalConnected);

    return () => {
      room.off(RoomEvent.SignalConnected, onSignalConnected);
    };
  }, [room.state, audio, video, screen]);

  useEffect(() => {
    if (!token) {
      return;
    }
    if (!serverUrl) {
      console.warn('no livekit url provided');
      onError?.(Error('no livekit url provided'));
      return;
    }
    if (connect) {
      room.connect(serverUrl, token, connectOptions).catch((e: any) => {
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
  return room;
};

export const LiveKitRoom = (props: LiveKitRoomProps) => {
  const room = useLiveKitRoom(props);
  return (
    <RoomContext.Provider value={room}>
      {props.children ?? <DefaultRoomView />}
    </RoomContext.Provider>
  );
};
