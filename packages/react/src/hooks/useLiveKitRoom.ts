import { log, setupLiveKitRoom } from '@livekit/components-core';
import type { DisconnectReason } from 'livekit-client';
import { Room, MediaDeviceFailure, RoomEvent } from 'livekit-client';
import * as React from 'react';
import type { HTMLAttributes } from 'react';

import type { LiveKitRoomProps } from '../components';
import { mergeProps } from '../mergeProps';
import { roomOptionsStringifyReplacer } from '../utils';

const defaultRoomProps: Partial<LiveKitRoomProps> = {
  connect: true,
  audio: false,
  video: false,
};

/**
 * The `useLiveKitRoom` hook is used to implement the `LiveKitRoom` or your custom implementation of it.
 * It returns a `Room` instance and HTML props that should be applied to the root element of the component.
 *
 * @example
 * ```tsx
 * const { room, htmlProps } = useLiveKitRoom();
 * return <div {...htmlProps}>...</div>;
 * ```
 * @public
 */
export function useLiveKitRoom<T extends HTMLElement>(
  props: LiveKitRoomProps,
): {
  room: Room | undefined;
  htmlProps: HTMLAttributes<T>;
} {
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
    onEncryptionError,
    simulateParticipants,
    ...rest
  } = { ...defaultRoomProps, ...props };
  if (options && passedRoom) {
    log.warn(
      'when using a manually created room, the options object will be ignored. set the desired options directly when creating the room instead.',
    );
  }

  const [room, setRoom] = React.useState<Room | undefined>();

  const shouldConnect = React.useRef(connect);

  React.useEffect(() => {
    setRoom(passedRoom ?? new Room(options));
  }, [passedRoom, JSON.stringify(options, roomOptionsStringifyReplacer)]);

  const htmlProps = React.useMemo(() => {
    const { className } = setupLiveKitRoom();
    return mergeProps(rest, { className }) as HTMLAttributes<T>;
  }, [rest]);

  React.useEffect(() => {
    if (!room) return;
    const onSignalConnected = () => {
      const localP = room.localParticipant;

      log.debug('trying to publish local tracks');
      Promise.all([
        localP.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined),
        localP.setCameraEnabled(!!video, typeof video !== 'boolean' ? video : undefined),
        localP.setScreenShareEnabled(!!screen, typeof screen !== 'boolean' ? screen : undefined),
      ]).catch((e) => {
        log.warn(e);
        onError?.(e as Error);
      });
    };

    const handleMediaDeviceError = (e: Error, kind?: MediaDeviceKind) => {
      const mediaDeviceFailure = MediaDeviceFailure.getFailure(e);
      onMediaDeviceFailure?.(mediaDeviceFailure, kind);
    };
    const handleEncryptionError = (e: Error) => {
      onEncryptionError?.(e);
    };
    const handleDisconnected = (reason?: DisconnectReason) => {
      onDisconnected?.(reason);
    };
    const handleConnected = () => {
      onConnected?.();
    };

    room
      .on(RoomEvent.SignalConnected, onSignalConnected)
      .on(RoomEvent.MediaDevicesError, handleMediaDeviceError)
      .on(RoomEvent.EncryptionError, handleEncryptionError)
      .on(RoomEvent.Disconnected, handleDisconnected)
      .on(RoomEvent.Connected, handleConnected);

    return () => {
      room
        .off(RoomEvent.SignalConnected, onSignalConnected)
        .off(RoomEvent.MediaDevicesError, handleMediaDeviceError)
        .off(RoomEvent.EncryptionError, handleEncryptionError)
        .off(RoomEvent.Disconnected, handleDisconnected)
        .off(RoomEvent.Connected, handleConnected);
    };
  }, [
    room,
    audio,
    video,
    screen,
    onError,
    onEncryptionError,
    onMediaDeviceFailure,
    onConnected,
    onDisconnected,
  ]);

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

    if (connect) {
      shouldConnect.current = true;
      log.debug('connecting');
      if (!token) {
        log.debug('no token yet');
        return;
      }
      if (!serverUrl) {
        log.warn('no livekit url provided');
        onError?.(Error('no livekit url provided'));
        return;
      }
      room.connect(serverUrl, token, connectOptions).catch((e) => {
        log.warn(e);
        if (shouldConnect.current === true) {
          onError?.(e as Error);
        }
      });
    } else {
      log.debug('disconnecting because connect is false');
      shouldConnect.current = false;
      room.disconnect();
    }
  }, [
    connect,
    token,
    JSON.stringify(connectOptions),
    room,
    onError,
    serverUrl,
    simulateParticipants,
  ]);

  React.useEffect(() => {
    if (!room) return;
    return () => {
      log.info('disconnecting on onmount');
      room.disconnect();
    };
  }, [room]);

  return { room, htmlProps };
}
