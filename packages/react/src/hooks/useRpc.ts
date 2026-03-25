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
export type RpcRawHandler = (data: RpcInvocationData) => Promise<string>;

/** @beta */
export type RpcMethodDescriptor<Input = string, Output = string> = {
  parse?: (raw: string) => Input;
  serialize?: (val: Output) => string;
  handler: (payload: Input, context: RpcInvocationData) => Promise<Output>;
};

/** @beta */
export type RpcMethod<Input = unknown, Output = unknown> = RpcRawHandler | RpcMethodDescriptor<Input, Output>;

type PerformRpcDescriptor<Input = string, Output = string> = Omit<PerformRpcParams, 'payload'> & {
  parse?: (raw: string) => Output;
  serialize?: (val: Input) => string;
  payload: Input,
};

/** @beta */
export type RpcJsonParams<Input = unknown> = Omit<PerformRpcParams, 'payload'> & { payload: Input };

/** Options for {@link useRpc}.
 * @beta */
export type UseRpcOptions = {
  /** Only accept RPCs from this participant. Others receive UNSUPPORTED_METHOD. */
  from?: string | Participant;
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
  function json<Input, Output>(value: RpcJsonParams<Input>): PerformRpcDescriptor<Output>;
  function json<Input, Output>(
    handlerOrValue: RpcJsonParams<Input> | ((payload: Input, data: RpcInvocationData) => Promise<Output>)
  ): RpcMethodDescriptor<Input, Output> | PerformRpcDescriptor<Input, Output> {
    if (typeof handlerOrValue === 'function') {
      return {
        parse: (raw: string) => JSON.parse(raw),
        serialize: (val: unknown) => JSON.stringify(val),
        handler: handlerOrValue as RpcMethodDescriptor<Input, Output>["handler"],
      };
    }

    return {
      ...handlerOrValue,
      parse: (raw: string) => JSON.parse(raw),
      serialize: (val: unknown) => JSON.stringify(val),
    };
  }

  return {
    json,
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

async function resolveHandler<Input, Output>(method: RpcMethod<Input, Output>, data: RpcInvocationData): Promise<string> {
  if (typeof method === 'function') {
    return method(data);
  }

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
  } else if (typeof result !== "string") {
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
  methods?: Record<string, RpcMethod>,
  options?: UseRpcOptions,
): UseRpcReturn;
export function useRpc(
  session?: UseSessionReturn,
  methods?: Record<string, RpcMethod>,
  options?: UseRpcOptions,
): UseRpcReturn;
export function useRpc(
  methodsOrSession?: Record<string, RpcMethod> | UseSessionReturn,
  optionsOrMethods?: UseRpcOptions | Record<string, RpcMethod>,
  maybeOptions?: UseRpcOptions,
): UseRpcReturn {
  let methods, options, session;
  if (methodsOrSession?.room) {
    session = methodsOrSession as UseSessionReturn;
    methods = optionsOrMethods as Record<string, RpcMethod>;
    options = maybeOptions!;
  } else {
    methods = methodsOrSession as Record<string, RpcMethod>;
    options = optionsOrMethods as UseRpcOptions;
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
          throw RpcError.builtIn('UNSUPPORTED_METHOD', `Method not available for caller ${data.callerIdentity}`);
        }

        // Resolve the latest handler from the ref
        const handler = handlersRef.current?.[name];
        if (!handler) {
          throw RpcError.builtIn('APPLICATION_ERROR', `No handler registered for method "${name}"`);
        }

        return resolveHandler(handler, data);
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
