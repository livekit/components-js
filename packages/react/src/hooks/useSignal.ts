import { Signal } from '@livekit/components-core';
import { useCallback, useSyncExternalStore } from 'react';

export type AnySignal<T> = Signal.State<T> | Signal.Computed<T>;

export function useSignal<T>(signal: AnySignal<T>): T {
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
      watcher.watch(signal);
      return () => watcher.unwatch(signal);
    },
    [signal],
  );
  const getSnapshot = () => signal.get();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
