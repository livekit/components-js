import {
  AudioCaptureOptions,
  ConnectionState,
  RoomConnectOptions,
  RoomOptions,
  ScreenShareCaptureOptions,
  VideoCaptureOptions,
} from 'livekit-client';
import React, { ReactNode, useEffect } from 'react';
import { useRoom, useToken } from './RoomProvider';

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

export const LiveKitRoom = ({
  roomName,
  children,
  userIdentity,
  connectOptions,
  connect,
  audio,
  video,
  screen,
}: LiveKitRoomProps) => {
  const roomState = useRoom();
  const token = useToken(roomName, userIdentity);

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

  return <div className="livekit-room">{children}</div>;
};
