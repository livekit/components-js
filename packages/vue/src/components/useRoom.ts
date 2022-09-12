import {
  Room,
  RoomEvent,
  RoomOptions,
  RoomConnectOptions,
  AudioCaptureOptions,
  VideoCaptureOptions,
  ScreenShareCaptureOptions,
  ConnectionState,
} from 'livekit-client';
import { roomEventSelector } from '@livekit/components-core';
import type { Subscription } from 'rxjs';
import { inject, isRef, onMounted, onUnmounted, Ref, unref, watchEffect } from 'vue';

export type LiveKitRoomProps = {
  serverUrl?: string | Ref<string | undefined>;
  token?: string | Ref<string | undefined>;
  options?: RoomOptions;
  connectOptions?: RoomConnectOptions;
  audio?: AudioCaptureOptions | boolean;
  video?: VideoCaptureOptions | boolean;
  screen?: ScreenShareCaptureOptions | boolean;
  connect?: boolean | Ref<boolean | undefined>;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
};

export const RoomContextKey = 'lk-room';

export function useRoomContext() {
  const room = inject(RoomContextKey);
  if (!room) {
    throw Error('needs to be within room provider');
  }
  return room as Room;
}

// by convention, composable function names start with "use"
export function useRoom({
  token,
  serverUrl,
  options,
  connectOptions,
  connect,
  audio,
  video,
  screen,
  onConnected,
  onDisconnected,
  onError,
}: LiveKitRoomProps) {
  // state encapsulated and managed by the composable
  const room = new Room(options);

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

  let connectionStateChangeListener: Subscription;
  onMounted(() => {
    room.on(RoomEvent.SignalConnected, onSignalConnected);
    connectionStateChangeListener = roomEventSelector(
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
  });
  onUnmounted(() => {
    room.off(RoomEvent.SignalConnected, onSignalConnected);
    connectionStateChangeListener?.unsubscribe();
  });

  function doConnect(onCleanup?: (fn: () => void) => void) {
    console.log('running connect', token);
    if (unref(token) && unref(serverUrl)) {
      if (unref(connect)) {
        console.log('connect room');
        room
          // @ts-ignore
          .connect(unref(serverUrl), unref(token), connectOptions)
          .then(() => console.log('room connected'));
      } else {
        console.log('disconnect room');

        room.disconnect();
      }
    }
    onCleanup?.(() => room.disconnect());
  }

  if (isRef(serverUrl) || isRef(token) || isRef(connect)) {
    // setup reactive re-fetch if input URL is a ref
    watchEffect(doConnect);
  } else {
    // otherwise, just connect once
    // and avoid the overhead of a watcher
    doConnect();
  }

  // expose managed state as return value
  return room;
}
