// inspired by https://github.com/dai-shi/use-signals/blob/main/src/use-signal.ts
import { Signal } from '@livekit/components-core';
import { useCallback, useSyncExternalStore } from 'react';

export type AnySignal<T> = Signal.State<T> | Signal.Computed<T>;

export function useSignal<S extends AnySignal<T> | undefined, T>(
  signal: S,
): S extends undefined ? undefined : T {
  const subscribe = useCallback(
    (callback: () => void) => {
      let needsEnqueue = true;
      const watcher = new Signal.subtle.Watcher(() => {
        if (needsEnqueue) {
          needsEnqueue = false;
          queueMicrotask(processPending);
        }
      });
      function processPending() {
        needsEnqueue = true;
        callback();
        watcher.watch(); // re-watch
      }
      if (signal) {
        watcher.watch(signal);
        return () => watcher.unwatch(signal);
      }
      return () => {};
    },
    [signal],
  );
  const getSnapshot = () => signal?.get();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as S extends undefined
    ? undefined
    : T;
}
