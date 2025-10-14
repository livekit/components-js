import * as React from 'react';
import TypedEventEmitter, { EventMap } from 'typed-emitter';

/** @public */
export function useEvents<
  Emitter extends TypedEventEmitter<EventMap>,
  EmitterEventMap extends Emitter extends TypedEventEmitter<infer EM> ? EM : never,
  Event extends Parameters<Emitter['on']>[0],
  Callback extends EmitterEventMap[Event],
>(
  instance: Emitter | { internal: { emitter: Emitter } } | null | undefined,
  event: Event,
  handlerFn: Callback | undefined,
  dependencies?: React.DependencyList,
) {
  const fallback = React.useMemo(() => () => {}, []);
  const wrappedCallback = React.useCallback(handlerFn ?? fallback, dependencies ?? []);
  const callback = dependencies ? wrappedCallback : handlerFn;

  const emitter = React.useMemo(() => {
    if (!instance) {
      return null;
    }
    if ('internal' in instance) {
      return instance.internal.emitter;
    }
    return instance;
  }, [instance]);

  React.useEffect(() => {
    if (!emitter || !callback) {
      return;
    }
    emitter.on(event, callback);
    return () => {
      emitter.off(event, callback);
    };
  }, [emitter, event, callback]);
}
