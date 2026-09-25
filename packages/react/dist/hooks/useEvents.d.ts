import { default as TypedEventEmitter, EventMap } from 'typed-emitter';
import * as React from 'react';
/** @public */
export declare function useEvents<Emitter extends TypedEventEmitter<EventMap>, EmitterEventMap extends Emitter extends TypedEventEmitter<infer EM> ? EM : never, Event extends Parameters<Emitter['on']>[0], Callback extends EmitterEventMap[Event]>(instance: Emitter | {
    internal: {
        emitter: Emitter;
    };
} | null | undefined, event: Event, handlerFn: Callback | undefined, dependencies?: React.DependencyList): void;
//# sourceMappingURL=useEvents.d.ts.map