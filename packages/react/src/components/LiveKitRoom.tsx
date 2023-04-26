import { log, setupLiveKitRoom } from '@livekit/components-core';
import type {
  AudioCaptureOptions,
  RoomConnectOptions,
  RoomOptions,
  ScreenShareCaptureOptions,
  VideoCaptureOptions,
} from 'livekit-client';
import { ConnectionState, MediaDeviceFailure, Room, RoomEvent } from 'livekit-client';
import * as React from 'react';
import { RoomContext } from '../context';
import { mergeProps } from '../utils';

/** @public */
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
  onMediaDeviceFailure?: (failure?: MediaDeviceFailure) => void;
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

/** @public */
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
    onMediaDeviceFailure,
    simulateParticipants,
    ...rest
  } = { ...defaultRoomProps, ...props };
  if (options && passedRoom) {
    log.warn(
      'when using a manually created room, the options object will be ignored. set the desired options directly when creating the room instead.',
    );
  }

  const [room, setRoom] = React.useState<Room | undefined>();

  React.useEffect(() => {
    setRoom(passedRoom ?? new Room(options));
  }, [options, passedRoom]);

  const htmlProps = React.useMemo(() => mergeProps(rest, setupLiveKitRoom()), [rest]);

  React.useEffect(() => {
    if (!room) return;
    const onSignalConnected = () => {
      const localP = room.localParticipant;
      try {
        log.debug('trying to publish local tracks');
        localP.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined);
        localP.setCameraEnabled(!!video, typeof video !== 'boolean' ? video : undefined);
        localP.setScreenShareEnabled(!!screen, typeof screen !== 'boolean' ? screen : undefined);
      } catch (e) {
        log.warn(e);
        onError?.(e as Error);
      }
    };

    const onMediaDeviceError = (e: Error) => {
      const mediaDeviceFailure = MediaDeviceFailure.getFailure(e);
      onMediaDeviceFailure?.(mediaDeviceFailure);
    };
    room.on(RoomEvent.SignalConnected, onSignalConnected);
    room.on(RoomEvent.MediaDevicesError, onMediaDeviceError);

    return () => {
      room.off(RoomEvent.SignalConnected, onSignalConnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDeviceError);
    };
  }, [room, audio, video, screen, onError]);

  React.useEffect(() => {
    if (!room) return;

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
      return;
    }
    if (!token) {
      log.debug('no token yet');
      return;
    }
    if (!serverUrl) {
      log.warn('no livekit url provided');
      onError?.(Error('no livekit url provided'));
      return;
    }
    if (connect) {
      log.debug('connecting');
      room.connect(serverUrl, token, connectOptions).catch((e) => {
        log.warn(e);
        onError?.(e as Error);
      });
    } else {
      log.debug('disconnecting because connect is false');
      room.disconnect();
    }
  }, [connect, token, connectOptions, room, onError, serverUrl, simulateParticipants]);

  React.useEffect(() => {
    if (!room) return;
    const connectionStateChangeListener = (state: ConnectionState) => {
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
    };
    room.on(RoomEvent.ConnectionStateChanged, connectionStateChangeListener);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, connectionStateChangeListener);
    };
  }, [token, onConnected, onDisconnected, room]);

  React.useEffect(() => {
    if (!room) return;
    return () => {
      log.info('disconnecting on onmount');
      room.disconnect();
    };
  }, [room]);

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
 *     ...
 * </LiveKitRoom>
 * ```
 * @public
 */
export function LiveKitRoom(props: React.PropsWithChildren<LiveKitRoomProps>) {
  const { room, htmlProps } = useLiveKitRoom(props);
  return (
    <div {...htmlProps}>
      {room && <RoomContext.Provider value={room}>{props.children}</RoomContext.Provider>}
    </div>
  );
}
