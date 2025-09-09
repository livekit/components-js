import { useEffect, useCallback, useMemo } from "react";
import TypedEventEmitter, { EventMap } from "typed-emitter";

export function useAgentEvents<
  Emitter extends TypedEventEmitter<EventMap>,
  EmitterEventMap extends (Emitter extends TypedEventEmitter<infer EM> ? EM : never),
  Event extends Parameters<Emitter["on"]>[0],
  Callback extends EmitterEventMap[Event],
>(
  instance: { subtle: { emitter: Emitter } } | null | undefined,
  event: Event,
  handlerFn: Callback | undefined,
  dependencies?: React.DependencyList
) {
  const fallback = useMemo(() => () => {}, []);
  const wrappedCallback = useCallback(handlerFn ?? fallback, dependencies ?? []);
  const callback = dependencies ? wrappedCallback : handlerFn;

  useEffect(() => {
    const emitter = instance?.subtle.emitter;
    if (!emitter || !callback) {
      return;
    }
    emitter.on(event, callback);
    return () => {
      emitter.off(event, callback);
    };
  }, [instance?.subtle.emitter, event, callback]);
}
