import { roomEventSelector, setupLiveKitRoom } from '@livekit/components-core';
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
import * as React from 'react';
import { RoomContext } from '../context';
import { VideoConference } from '../prefabs/VideoConference';
import { mergeProps } from '../utils';

export interface LiveKitRoomProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  /**
   * URL to the LiveKit server.
   * For example: `wss://<domain>.livekit.cloud`
   * To simplify the implementation, `undefined` is also accepted as an intermediate value, but only with a valid string url can the connection be established.
   */
  serverUrl: string | undefined;
  /**
   * A user specific access token for a client to authenticate to the room.
   * This token is necessary to establish a connection to the room.
   * To simplify the implementation, `undefined` is also accepted as an intermediate value, but only with a valid string token can the connection be established.
   *
   * @see https://docs.livekit.io/cloud/project-management/keys-and-tokens/#generating-access-tokens
   */
  token: string | undefined;
  /**
   * Enable audio capabilities in your LiveKit room.
   * @defaultValue `true`
   * @see https://docs.livekit.io/client-sdk-js/interfaces/AudioCaptureOptions.html
   */
  audio?: AudioCaptureOptions | boolean;
  /**
   * Enable video capabilities in your LiveKit room.
   * @defaultValue `true`
   * @see https://docs.livekit.io/client-sdk-js/interfaces/VideoCaptureOptions.html
   */
  video?: VideoCaptureOptions | boolean;
  /**
   * Enable screen share capabilities in your LiveKit room.
   * @defaultValue `true`
   * @see https://docs.livekit.io/client-sdk-js/interfaces/ScreenShareCaptureOptions.html
   */
  screen?: ScreenShareCaptureOptions | boolean;
  /**
   * If set to true a connection to LiveKit room is initiated.
   * @defaultValue `true`
   */
  connect?: boolean;
  /**
   * Options for when creating a new room.
   * When you pass your own room instance to this component, these options have no effect.
   * Instead, set the options directly in the room instance.
   *
   * @see https://docs.livekit.io/client-sdk-js/interfaces/RoomOptions.html
   */
  options?: RoomOptions;
  /**
   * Define options how to connect to the LiveKit server.
   *
   * @see https://docs.livekit.io/client-sdk-js/interfaces/RoomConnectOptions.html
   */
  connectOptions?: RoomConnectOptions;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  /**
   * Optional room instance.
   * By passing your own room instance you overwrite the `options` parameter,
   * make sure to set the options directly on the room instance itself.
   */
  room?: Room;
  simulateParticipants?: number | undefined;
}

// type RoomContextState = {
//   room: Room;
//   connectionState: ConnectionState;
//   participants: Participant[];
//   audioTracks: AudioTrack[];
// };

const defaultRoomProps: Partial<LiveKitRoomProps> = {
  connect: true,
  audio: false,
  video: false,
};
export function useLiveKitRoom(props: LiveKitRoomProps) {
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
    simulateParticipants,
    ...rest
  } = { ...defaultRoomProps, ...props };
  if (options && passedRoom) {
    console.warn(
      'when using a manually created room, the options object will be ignored. set the desired options directly when creating the room instead.',
    );
  }
  const [room] = React.useState<Room>(passedRoom ?? new Room(options));
  // setLogLevel('debug');

  const htmlProps = React.useMemo(() => mergeProps(rest, setupLiveKitRoom()), [rest]);

  React.useEffect(() => {
    const onSignalConnected = () => {
      const localP = room.localParticipant;
      try {
        localP.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined);
        localP.setCameraEnabled(!!video, typeof video !== 'boolean' ? video : undefined);
        localP.setScreenShareEnabled(!!screen, typeof screen !== 'boolean' ? screen : undefined);
      } catch (e) {
        console.warn(e);
        onError?.(e as Error);
      }
    };
    room.on(RoomEvent.SignalConnected, onSignalConnected);

    return () => {
      room.off(RoomEvent.SignalConnected, onSignalConnected);
    };
  }, [room, audio, video, screen, onError]);

  React.useEffect(() => {
    if (simulateParticipants) {
      room.simulateParticipants({
        participants: {
          count: simulateParticipants,
        },
        publish: {
          audio: true,
          useRealTracks: true,
        },
      });
    }
    if (!token) {
      return;
    }
    if (!serverUrl) {
      console.warn('no livekit url provided');
      onError?.(Error('no livekit url provided'));
      return;
    }
    if (connect) {
      room.connect(serverUrl, token, connectOptions).catch((e) => {
        console.warn(e);
        onError?.(e as Error);
      });
    } else {
      room.disconnect();
    }
  }, [connect, token, connectOptions, room, onError, serverUrl]);

  React.useEffect(() => {
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
  }, [token, onConnected, onDisconnected, room]);
  return { room, htmlProps };
}

/**
 * The LiveKitRoom component provides the room context to all its child components.
 * It is generally the starting point of your LiveKit app and the root of the LiveKit component tree.
 * It provides the room state as a React context to all child components, so you don't have to pass it yourself.
 *
 * @example
 * ```tsx
 * <LiveKitRoom
 *  token='<livekit-token>'
 *  serverUrl='<url-to-livekit-server>'
 *  connect={true}
 * >
 *     {...}
 * </LiveKitRoom>
 * ```
 */
export function LiveKitRoom(props: React.PropsWithChildren<LiveKitRoomProps>) {
  const { room, htmlProps } = useLiveKitRoom(props);
  return (
    <div {...htmlProps}>
      <RoomContext.Provider value={room}>
        {props.children ?? <VideoConference />}
      </RoomContext.Provider>
    </div>
  );
}
