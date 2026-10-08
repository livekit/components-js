import { log, setupLiveKitRoom } from '@livekit/components-core';
import type { DisconnectReason } from 'livekit-client';
import { Room, MediaDeviceFailure, RoomEvent } from 'livekit-client';
import * as React from 'react';
import type { HTMLAttributes } from 'react';

import type { LiveKitRoomProps } from '../components';
import { mergeProps } from '../mergeProps';
import { DevicePermissionError } from '../prefabs/PreJoin';
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

  // Utility to detect permission-denied style errors across browsers/wrappers
  const isDeniedError = React.useCallback((err: Error): boolean => {
    const name = (err.name || '').toLowerCase();
    const message = (err.message || '').toLowerCase();
    return (
      name.includes('notallowed') ||
      name.includes('permissiondenied') ||
      name.includes('security') ||
      message.includes('permission denied') ||
      message.includes('denied by system') ||
      message.includes('blocked')
    );
  }, []);

  React.useEffect(() => {
    if (!room) return;
    const onSignalConnected = () => {
      const localP = room.localParticipant;

      log.debug('trying to publish local tracks');

      // Handle each track type separately to provide granular error handling
      const enableAudio = async () => {
        if (audio) {
          try {
            await localP.setMicrophoneEnabled(true, typeof audio !== 'boolean' ? audio : undefined);
          } catch (e) {
            const error = e as Error;
            log.warn('Failed to enable microphone:', error);

            // Wrap permission errors with device context for better handling
            const errorToReport = isDeniedError(error)
              ? new DevicePermissionError(error, 'audio')
              : error;

            // Don't call onError here - will be called after all tracks are attempted
            throw errorToReport;
          }
        }
      };

      const enableVideo = async () => {
        if (video) {
          try {
            await localP.setCameraEnabled(true, typeof video !== 'boolean' ? video : undefined);
          } catch (e) {
            const error = e as Error;
            log.warn('Failed to enable camera:', error);

            // Wrap permission errors with device context for better handling
            const errorToReport = isDeniedError(error)
              ? new DevicePermissionError(error, 'video')
              : error;

            // Don't call onError here - will be called after all tracks are attempted
            throw errorToReport;
          }
        }
      };

      const enableScreen = async () => {
        if (screen) {
          try {
            await localP.setScreenShareEnabled(
              true,
              typeof screen !== 'boolean' ? screen : undefined,
            );
          } catch (e) {
            log.warn('Failed to enable screen share:', e);
            // Don't call onError here - will be called after all tracks are attempted
            throw e as Error;
          }
        }
      };

      // Run all enables, then report errors after all attempts complete
      Promise.allSettled([enableAudio(), enableVideo(), enableScreen()]).then((results) => {
        const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

        if (failures.length > 0) {
          log.debug(`${failures.length} track(s) failed to enable`);

          // Call onError for each failure sequentially
          failures.forEach((failure) => {
            onError?.(failure.reason as Error);
          });
        }
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
    isDeniedError,
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
