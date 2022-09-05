// mouse.js
import { ref, onMounted, onUnmounted, Ref, unref, isRef, watchEffect, provide } from 'vue';
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

export type LiveKitRoomProps = {
  serverUrl: string | Ref<string>;
  token: string | Ref<string>;
  options?: RoomOptions;
  connectOptions?: RoomConnectOptions;
  audio?: AudioCaptureOptions | boolean;
  video?: VideoCaptureOptions | boolean;
  screen?: ScreenShareCaptureOptions | boolean;
  connect?: boolean | Ref<boolean>;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
};

export const RoomContextKey = 'lk-room';

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

  function doConnect() {
    if (unref(connect)) {
      console.log('connect room');
      room
        .connect(unref(serverUrl), unref(token), connectOptions)
        .then(() => console.log('room connected'));
    } else {
      console.log('disconnect room');

      room.disconnect();
    }
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

export const LiveKitRoom = {
  setup() {
    const token = ref('');
    const serverUrl = ref('');
    const connect = ref(true);
    const room = useRoom({ connect, token, serverUrl });

    provide(RoomContextKey, room);
  },
  template: `
    <slot></slot>`,
};
