import * as React from 'react';
import {
  type Participant,
  RpcError,
  type RpcInvocationData,
  type PerformRpcParams,
} from 'livekit-client';

import { useEnsureSession } from '../context';
import type { UseSessionReturn } from './useSession';

/** @beta */
export type RpcHandler<Input = any, Output = any> = (
  payload: Input,
  data: RpcInvocationData,
) => Promise<Output>;

/** @beta */
export type RpcMethodDescriptor<Input = string, Output = string> = {
  parse?: (raw: string) => Input;
  serialize?: (val: Output) => string;
  handler: RpcHandler<Input, Output>;
};

/** @beta */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RpcMethod<Input = any, Output = any> =
  | RpcHandler<Input, Output>
  | RpcMethodDescriptor<Input, Output>;

/** @beta */
export type PerformRpcDescriptor<Input = string, Output = string> = Omit<
  PerformRpcParams,
  'payload'
> & {
  parse?: (raw: string) => Output;
  serialize?: (val: Input) => string;
  payload: Input;
};

/** @beta */
export type RpcJsonParams<Input = unknown> = Omit<PerformRpcParams, 'payload'> & { payload: Input };

/** Options for {@link useRpc}.
 * @beta */
export type UseRpcOptions = {
  /** Only accept RPCs from this participant. Others receive UNSUPPORTED_METHOD. */
  from?: string | Participant;

  defaultSerializer?: <Input, Output>(
    handler: (payload: Input, data: RpcInvocationData) => Promise<Output>,
  ) => RpcMethodDescriptor<Input, Output>;
};

/**
 * Namespace for RPC helpers.
 *
 * `rpc.json` can be used in two ways:
 *
 * **Handler mode** (for registering methods via {@link useRpc}):
 * ```ts
 * useRpc({
 *   myMethod: rpc.json(async (payload: MyInput, ctx) => {
 *     return { result: 'value' };
 *   }),
 * });
 * ```
 *
 * **Payload mode** (for outbound calls via `performRpc`):
 * ```ts
 * const result = await performRpc(rpc.json<MyInput, MyOutput>(
 *   { destinationIdentity: '...', method: 'myMethod', payload: { key: 'value' } },
 * ));
 * ```
 *
 * @beta
 */
export const rpc = (() => {
  /* Overload: handler mode (for useRpc methods record) */
  function json<Input, Output>(
    handler: (payload: Input, data: RpcInvocationData) => Promise<Output>,
  ): RpcMethodDescriptor<Input, Output>;
  /* Overload: payload mode (for performRpc) */
  function json<Input, Output>(value: RpcJsonParams<Input>): PerformRpcDescriptor<Input, Output>;
  function json<Input, Output>(
    handlerOrValue:
      | RpcJsonParams<Input>
      | ((payload: Input, data: RpcInvocationData) => Promise<Output>),
  ): RpcMethodDescriptor<Input, Output> | PerformRpcDescriptor<Input, Output> {
    if (typeof handlerOrValue === 'function') {
      return {
        parse: (raw: string) => JSON.parse(raw),
        serialize: (val: unknown) => JSON.stringify(val),
        handler: handlerOrValue as RpcMethodDescriptor<Input, Output>['handler'],
      };
    }

    return {
      ...handlerOrValue,
      parse: (raw: string) => JSON.parse(raw),
      serialize: (val: unknown) => JSON.stringify(val),
    };
  }

  /* Overload: handler mode (for useRpc methods record) */
  function raw(
    handler: (payload: string, data: RpcInvocationData) => Promise<string>,
  ): RpcMethodDescriptor<string, string>;
  /* Overload: payload mode (for performRpc) */
  function raw(value: RpcJsonParams<string>): PerformRpcDescriptor<string, string>;
  function raw(
    handlerOrValue:
      | RpcJsonParams<string>
      | ((payload: string, data: RpcInvocationData) => Promise<string>),
  ): RpcMethodDescriptor<string, string> | PerformRpcDescriptor<string, string> {
    if (typeof handlerOrValue === 'function') {
      return {
        parse: (raw: string) => raw,
        serialize: (val: string) => val,
        handler: handlerOrValue,
      };
    }

    return {
      ...handlerOrValue,
      parse: (raw: string) => raw,
      serialize: (val: string) => val,
    };
  }

  return {
    json,
    raw,
  };
})();

/** @beta */
export type PerformRpcFn = {
  <Input = string, Output = string>(params: PerformRpcDescriptor<Input, Output>): Promise<Output>;
};

/** @beta */
export type UseRpcReturn = {
  performRpc: PerformRpcFn;
};

function isUseSessionReturn(value: unknown): value is UseSessionReturn {
  return (
    typeof value === 'object' &&
    value !== null &&
    'room' in value &&
    'connectionState' in value &&
    'internal' in value
  );
}

async function resolveDescriptor<Input, Output>(
  method: RpcMethodDescriptor<Input, Output>,
  data: RpcInvocationData,
): Promise<string> {
  let parsed: Input;
  if (method.parse) {
    try {
      parsed = method.parse(data.payload);
    } catch (e) {
      throw RpcError.builtIn('APPLICATION_ERROR', `Failed to parse RPC payload: ${e}`);
    }
  } else {
    parsed = data.payload as Input;
  }

  const result = await method.handler(parsed, data);

  if (method.serialize) {
    try {
      return method.serialize(result);
    } catch (e) {
      throw RpcError.builtIn('APPLICATION_ERROR', `Failed to serialize RPC response: ${e}`);
    }
  } else if (typeof result !== 'string') {
    throw RpcError.builtIn(
      'APPLICATION_ERROR',
      `Failed to serialize RPC response: return value from handler function not string. Did you mean to include a "serialize" RpcMethod key?`,
    );
  } else {
    return result;
  }
}

// ---------------------------------------------------------------------------
// useRpc hook
// ---------------------------------------------------------------------------

/**
 * Hook for declarative RPC method registration and outbound RPC calls.
 *
 * Registers handler functions for incoming RPC method calls and returns a `performRpc` function
 * for making outbound RPC calls to other participants.
 *
 * Handlers are registered on mount and unregistered on unmount. The effect lifecycle is driven
 * by the set of method names — handler function identity does not matter (they are captured by
 * ref), so inline functions work without `useCallback`.
 *
 * @example
 * ```tsx
 * const { performRpc } = useRpc({
 *   // JSON handler via preset
 *   getUserLocation: rpc.json(async (payload: { highAccuracy: boolean }, ctx) => {
 *     const pos = await getPosition(payload.highAccuracy);
 *     return { lat: pos.coords.latitude, lng: pos.coords.longitude };
 *   }),
 *
 *   // Raw string handler
 *   getTimezone: async (data) => Intl.DateTimeFormat().resolvedOptions().timeZone,
 * }, { from: session.agent });
 * ```
 *
 * @beta
 */
export function useRpc(
  session: UseSessionReturn,
  methods?: Record<string, RpcMethod>,
  options?: UseRpcOptions,
): UseRpcReturn;
export function useRpc(methods?: Record<string, RpcMethod>, options?: UseRpcOptions): UseRpcReturn;
export function useRpc(
  methodsOrSession?: Record<string, RpcMethod> | UseSessionReturn,
  optionsOrMethods?: UseRpcOptions | Record<string, RpcMethod>,
  maybeOptions?: UseRpcOptions,
): UseRpcReturn {
  let methods: Record<string, RpcMethod> | undefined;
  let options: UseRpcOptions | undefined;
  let session: UseSessionReturn | undefined;

  if (isUseSessionReturn(methodsOrSession)) {
    session = methodsOrSession;
    methods = optionsOrMethods as Record<string, RpcMethod> | undefined;
    options = maybeOptions;
  } else {
    methods = methodsOrSession;
    options = optionsOrMethods as UseRpcOptions | undefined;
  }

  const { room } = useEnsureSession(session);

  // Ref that always holds the latest handlers — updated synchronously on render
  const handlersRef = React.useRef(methods);
  handlersRef.current = methods;

  // Ref that always holds the latest options (for participant filter)
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  // Derive a stable string from the sorted method name set for the effect dependency.
  // The effect only re-runs when methods are added or removed, not when handler bodies change.
  const methodNamesEffectKey = React.useMemo(
    () =>
      Object.keys(methods ?? {})
        .sort()
        .join('\0'),
    [methods],
  );

  React.useEffect(() => {
    const currentMethods = handlersRef.current ?? {};
    const names = Object.keys(currentMethods);

    for (const name of names) {
      room.registerRpcMethod(name, async (data: RpcInvocationData) => {
        // Participant filter
        const from = optionsRef.current?.from;
        const fromIdentity = typeof from === 'string' ? from : from?.identity;
        if (fromIdentity && data.callerIdentity !== fromIdentity) {
          throw RpcError.builtIn(
            'UNSUPPORTED_METHOD',
            `Method not available for caller ${data.callerIdentity}`,
          );
        }

        // Resolve the latest handler from the ref
        const handler = handlersRef.current?.[name];
        if (!handler) {
          throw RpcError.builtIn('APPLICATION_ERROR', `No handler registered for method "${name}"`);
        }

        if (typeof handler === 'function') {
          const serializer = options?.defaultSerializer ?? rpc.json;
          return resolveDescriptor(serializer(handler), data);
        } else {
          return resolveDescriptor(handler, data);
        }
      });
    }

    return () => {
      for (const name of names) {
        room.unregisterRpcMethod(name);
      }
    };
  }, [room, methodNamesEffectKey]);

  // Stable performRpc function with overloads
  const performRpc: PerformRpcFn = React.useCallback(
    async <Input = string, Output = string>(params: PerformRpcDescriptor<Input, Output>) => {
      let serialized: string;
      if (params.serialize) {
        try {
          serialized = params.serialize(params.payload);
        } catch (e) {
          throw RpcError.builtIn('APPLICATION_ERROR', `Failed to serialize RPC payload: ${e}`);
        }
      } else {
        serialized = params.payload as string;
      }

      const rawResponse = await room.localParticipant.performRpc({
        destinationIdentity: params.destinationIdentity,
        method: params.method,
        payload: serialized,
        responseTimeout: params.responseTimeout,
      });

      if (params.parse) {
        try {
          return params.parse(rawResponse);
        } catch (e) {
          throw RpcError.builtIn('APPLICATION_ERROR', `Failed to serialize RPC response: ${e}`);
        }
      } else {
        return rawResponse as Output;
      }
    },
    [room],
  );

  return React.useMemo(() => ({ performRpc }), [performRpc]);
}
