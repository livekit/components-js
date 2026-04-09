import * as React from 'react';
import { RpcError, type RpcInvocationData, type PerformRpcParams } from 'livekit-client';

import { useEnsureSession } from '../context';
import { isUseSessionReturn, type UseSessionReturn } from './useSession';

// ---------------------------------------------------------------------------
// Serializer types + infrastructure
// ---------------------------------------------------------------------------

const SerializerSymbol = Symbol.for('lk.serializer');

/**
 * A bidirectional data format descriptor for RPC payloads.
 *
 * - `parse(raw)` decodes an incoming wire string into `Input` (used by handlers)
 * - `serialize(val)` encodes an `Output` value to a wire string (used by handlers)
 *
 * For symmetric serializers (`serializers.raw`), `Input === Output === string`.
 * For `serializers.json`, both default to `any` so each handler can annotate its own types.
 * Use `serializers.custom` to supply your own `parse`/`serialize` pair.
 *
 * @beta
 */
export type Serializer<Input = any, Output = any> = {
  symbol: typeof SerializerSymbol;
  parse: (raw: string) => Input;
  serialize: (val: Output) => string;
};

function isSerializer(v: unknown): v is Serializer<any, any> {
  return (
    typeof v === 'object' &&
    v !== null &&
    'symbol' in v &&
    (v as Record<string, unknown>)['symbol'] === SerializerSymbol
  );
}

// Extract Input/Output from a Serializer type for use in handler/performRpc constraints.
type SerializerInput<S> = S extends Serializer<infer Input, any> ? Input : any;
type SerializerOutput<S> = S extends Serializer<any, infer Output> ? Output : any;

/**
 * Serializer helpers for RPC payload encoding.
 *
 * @example
 * ```ts
 * // Inline handler — types inferred
 * useRpc(session, "myMethod", async (payload: MyInput) => myOutput);
 *
 * // Override default serializer for a handler
 * useRpc(session, "myMethod", async (payload) => payload, { serializer: serializers.raw() });
 *
 * // Manual serializer instances
 * const a = serializers.raw(); // Serializer<string, string>
 * const b = serializer.json<{ foo: string }, { bar: string }>(); // Serializer<{ foo: string }, { bar: string }>
 * ```
 *
 * @beta
 */
export const serializers = (() => {
  /**
   * JSON serializer — `JSON.parse` on the way in, `JSON.stringify` on the way out.
   * Defaults to `any` so individual handlers can annotate their own payload types.
   */
  function json<Input = any, Output = any>(): Serializer<Input, Output> {
    return custom({
      parse: (raw: string) => JSON.parse(raw) as Input,
      serialize: (val: unknown) => JSON.stringify(val),
    });
  }

  /** Raw string serializer — passes payloads through as plain strings with no encoding. */
  function raw() {
    return custom({
      parse: (raw: string) => raw,
      serialize: (val: string) => val,
    });
  }

  /** Custom serializer - allows custom defined parse and serialize functions */
  function custom<Input = any, Output = any>(
    params: Omit<Serializer<Input, Output>, 'symbol'>,
  ): Serializer<Input, Output> {
    return { ...params, symbol: SerializerSymbol };
  }

  return { json, raw, custom };
})();

// ---------------------------------------------------------------------------
// RPC types
// ---------------------------------------------------------------------------

/** @beta */
export type RpcHandler<Input = any, Output = any> = (
  payload: Input,
  data: RpcInvocationData,
) => Promise<Output>;

/**
 * Base RPC call parameters with an arbitrary payload type (used when the payload
 * will be serialized by a serializer).
 *
 * @beta
 */
export type RpcCallParams<Payload> = Omit<PerformRpcParams, 'payload'> & { payload: Payload };

/**
 * Options for {@link useRpc}.
 * @beta
 */
export type UseRpcOptions<S extends Serializer<any, any> = Serializer<any, any>> = {
  /** Only accept RPCs from this participant. Others will receive UNSUPPORTED_METHOD. */
  fromIdentity?: string;
  /**
   * Serializer applied to the data coming in and leaving the handler. Defaults to `serializers.json()`
   */
  serializer?: S;
};

// ---------------------------------------------------------------------------
// useRpc hook
// ---------------------------------------------------------------------------

/** @beta */
export type PerformRpcFn = {
  /** Serializer-wrapped call: payload is serialized and response is parsed by the serializer. */
  <Output = string, Input = unknown>(
    params: RpcCallParams<Input>,
    serializer: Serializer<Output, Input>,
  ): Promise<Output>;
  /** Plain call: payload is already a string, response is returned as a string. */
  (params: PerformRpcParams): Promise<string>;
};

/** @beta */
export type UseRpcReturn = {
  performRpc: PerformRpcFn;
};

/**
 * Hook for declarative RPC method registration and outbound RPC calls.
 *
 * Registers a handler for an incoming RPC method and returns a `performRpc`
 * function for outbound calls. The handler is registered on mount and
 * unregistered on unmount. Handler identity does not matter (captured by ref),
 * so inline functions work without `useCallback`.
 *
 * @example
 * ```tsx
 * const { performRpc } = useRpc(session, "getUserLocation", async (payload: { highAccuracy: boolean }) => {
 *   const pos = await getPosition(payload.highAccuracy);
 *   return { lat: pos.coords.latitude, lng: pos.coords.longitude };
 * });
 * ```
 *
 * @beta
 */
export function useRpc<S extends Serializer<any, any>>(
  session: UseSessionReturn,
  methodName: string,
  handler: RpcHandler<SerializerInput<S>, SerializerOutput<S>>,
  options?: UseRpcOptions<S>,
): UseRpcReturn;
export function useRpc<S extends Serializer<any, any>>(
  methodName: string,
  handler: RpcHandler<SerializerInput<S>, SerializerOutput<S>>,
  options?: UseRpcOptions<S>,
): UseRpcReturn;
export function useRpc(
  methodNameOrSession?: string | UseSessionReturn,
  handlerOrMethodName?: RpcHandler<any, any> | string,
  optionsOrHandler?: UseRpcOptions<Serializer<any, any>> | RpcHandler<any, any>,
  maybeOptions?: UseRpcOptions<Serializer<any, any>>,
): UseRpcReturn {
  let session: UseSessionReturn | undefined;
  let methodName: string | undefined;
  let handler: RpcHandler<any, any> | undefined;
  let options: UseRpcOptions<Serializer<any, any>> | undefined;

  if (isUseSessionReturn(methodNameOrSession)) {
    session = methodNameOrSession;
    methodName = handlerOrMethodName as string;
    handler = optionsOrHandler as RpcHandler<any, any>;
    options = maybeOptions;
  } else {
    methodName = methodNameOrSession;
    handler = handlerOrMethodName as RpcHandler<any, any>;
    options = optionsOrHandler as UseRpcOptions<any>;
  }

  const { room } = useEnsureSession(session);

  // Ref that always holds the latest handler — updated synchronously on render
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  // Ref that always holds the latest options
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  React.useEffect(() => {
    if (!methodName) {
      return;
    }

    room.registerRpcMethod(methodName, async (data: RpcInvocationData) => {
      const fromIdentity = optionsRef.current?.fromIdentity;
      if (fromIdentity && data.callerIdentity !== fromIdentity) {
        throw RpcError.builtIn(
          'UNSUPPORTED_METHOD',
          `Method not available for caller ${data.callerIdentity}`,
        );
      }

      const currentHandler = handlerRef.current;
      if (!currentHandler) {
        throw RpcError.builtIn(
          'APPLICATION_ERROR',
          `No handler registered for method "${methodName}"`,
        );
      }

      const serializer = optionsRef.current?.serializer ?? serializers.json();

      let parsed;
      try {
        parsed = serializer.parse(data.payload);
      } catch (e) {
        throw RpcError.builtIn('APPLICATION_ERROR', `Failed to parse RPC payload: ${e}`);
      }

      const result = await currentHandler(parsed, data);

      try {
        return serializer.serialize(result);
      } catch (e) {
        throw RpcError.builtIn('APPLICATION_ERROR', `Failed to serialize RPC response: ${e}`);
      }
    });

    return () => {
      room.unregisterRpcMethod(methodName);
    };
  }, [room, methodName]);

  // Stable performRpc function
  const performRpc: PerformRpcFn = React.useCallback(
    async (
      params: RpcCallParams<unknown>,
      serializer: Serializer<any, any> = serializers.json(),
    ) => {
      if (isSerializer(serializer)) {
        let serialized: string;
        try {
          serialized = serializer.serialize(params.payload);
        } catch (e) {
          throw RpcError.builtIn('APPLICATION_ERROR', `Failed to serialize RPC payload: ${e}`);
        }
        const rawResponse = await room.localParticipant.performRpc({
          destinationIdentity: params.destinationIdentity,
          method: params.method,
          payload: serialized,
          responseTimeout: params.responseTimeout,
        });
        try {
          return serializer.parse(rawResponse);
        } catch (e) {
          throw RpcError.builtIn('APPLICATION_ERROR', `Failed to parse RPC response: ${e}`);
        }
      } else {
        return room.localParticipant.performRpc(params as PerformRpcParams);
      }
    },
    [room],
  );

  return React.useMemo(() => ({ performRpc }), [performRpc]);
}
