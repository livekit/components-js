import * as React from 'react';
import {
  type Participant,
  RpcError,
  type RpcInvocationData,
  type PerformRpcParams,
} from 'livekit-client';

import { useEnsureSession } from '../context';
import type { UseSessionReturn } from './useSession';

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

export const SchemaSymbol = Symbol.for('lk.schema');

/**
 * A bidirectional data format descriptor for RPC payloads.
 *
 * - `parse(raw)` decodes an incoming wire string into `Input` (used by handlers)
 * - `serialize(val)` encodes an `Output` value to a wire string (used by handlers)
 *
 * For symmetric schemas (`schema.raw`), `Input === Output === string`.
 * For `schema.json`, both default to `any` so each handler can annotate its own types.
 *
 * @beta
 */
export type Schema<Input = any, Output = any> = {
  symbol: typeof SchemaSymbol;
  parse: (raw: string) => Input;
  serialize: (val: Output) => string;
};

function isSchema(v: unknown): v is Schema<any, any> {
  return (
    typeof v === 'object' &&
    v !== null &&
    'symbol' in v &&
    (v as Record<string, unknown>)['symbol'] === SchemaSymbol
  );
}

// Extract Input/Output from a Schema type for use in handler/performRpc constraints.
type SchemaInput<S> = S extends Schema<infer Input, any> ? Input : any;
type SchemaOutput<S> = S extends Schema<any, infer Output> ? Output : any;

// ---------------------------------------------------------------------------
// schema namespace
// ---------------------------------------------------------------------------

/**
 * Schema helpers for RPC payload encoding.
 *
 * @example
 * ```ts
 * // Inline handler — types inferred
 * useRpc({ myMethod: async (payload: MyInput) => myOutput }, { schema: schema.json() });
 *
 * // Override default schema for all plain handlers in this hook
 * useRpc({ myMethod: async (payload) => payload }, { schema: schema.raw() });
 *
 * // Manual schema instances
 * const a = schema.raw(); // Schema<string, string>
 * const b = schema.json<{ foo: string }, { bar: string }>(); // Schema<{ foo: string }, { bar: string }>
 * ```
 *
 * @beta
 */
export const schema = (() => {
  /**
   * JSON schema — `JSON.parse` on the way in, `JSON.stringify` on the way out.
   * Defaults to `any` so individual handlers can annotate their own payload types.
   */
  function json<Input = any, Output = any>(): Schema<Input, Output> {
    return custom({
      parse: (raw: string) => JSON.parse(raw) as Input,
      serialize: (val: unknown) => JSON.stringify(val),
    });
  }

  /** Raw string schema — passes payloads through as plain strings with no encoding. */
  function raw() {
    return custom({
      parse: (raw: string) => raw,
      serialize: (val: string) => val,
    });
  }

  /** Custom schema - allows custom defined parse and serialize functions */
  function custom<Input = any, Output = any>(params: Omit<Schema<Input, Output>, "symbol">): Schema<Input, Output> {
    return { ...params, symbol: SchemaSymbol };
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
 * will be serialized by a schema).
 *
 * @beta
 */
export type RpcCallParams<Payload> = Omit<PerformRpcParams, 'payload'> & { payload: Payload };

/**
 * Options for {@link useRpc}.
 * @beta
 */
export type UseRpcOptions<S extends Schema<any, any> = Schema<any, any>> = {
  /** Only accept RPCs from this participant. Others will receive UNSUPPORTED_METHOD. */
  from?: string | Participant;
  /**
   * Schema applied to the data coming in and leaving the handler. Defaults to `schema.json()`
   */
  schema?: S;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function resolveWithSchema<S extends Schema<any, any>>(
  schema: S,
  handler: RpcHandler<SchemaInput<S>, SchemaOutput<S>>,
  data: RpcInvocationData,
): Promise<string> {
  let parsed;
  try {
    parsed = schema.parse(data.payload);
  } catch (e) {
    throw RpcError.builtIn('APPLICATION_ERROR', `Failed to parse RPC payload: ${e}`);
  }

  const result = await handler(parsed, data);

  try {
    return schema.serialize(result);
  } catch (e) {
    throw RpcError.builtIn('APPLICATION_ERROR', `Failed to serialize RPC response: ${e}`);
  }
}

function isUseSessionReturn(value: unknown): value is UseSessionReturn {
  return (
    typeof value === 'object' &&
    value !== null &&
    'room' in value &&
    'connectionState' in value &&
    'internal' in value
  );
}

// ---------------------------------------------------------------------------
// useRpc hook
// ---------------------------------------------------------------------------

/** @beta */
export type PerformRpcFn = {
  /** Schema-wrapped call: payload is serialized and response is parsed by the schema. */
  <Output = string, Input = unknown>(params: RpcCallParams<Input>, schema: Schema<Output, Input>): Promise<Output>;
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
 * Registers handler functions for incoming RPC calls and returns a `performRpc`
 * function for outbound calls. Handlers are registered on mount and unregistered
 * on unmount. The effect lifecycle is driven by the set of method names — handler
 * identity does not matter (captured by ref), so inline functions work without
 * `useCallback`.
 *
 * @example
 * ```tsx
 * const { performRpc } = useRpc({
 *   // Schema inferred from handler types
 *   getUserLocation: schema.json(async (payload: { highAccuracy: boolean }) => {
 *     const pos = await getPosition(payload.highAccuracy);
 *     return { lat: pos.coords.latitude, lng: pos.coords.longitude };
 *   }),
 *
 *   // Plain handler — uses default schema (json)
 *   getTimezone: async () => Intl.DateTimeFormat().resolvedOptions().timeZone,
 * }, { from: session.agent });
 * ```
 *
 * @beta
 */
export function useRpc<S extends Schema<any, any> = Schema<any, any>>(
  session: UseSessionReturn,
  methodName: string,
  handler: RpcHandler<SchemaInput<S>, SchemaOutput<S>>,
  options?: UseRpcOptions<S>,
): UseRpcReturn;
export function useRpc<S extends Schema<any, any> = Schema<any, any>>(
  methodName: string,
  handler: RpcHandler<SchemaInput<S>, SchemaOutput<S>>,
  options?: UseRpcOptions<S>,
): UseRpcReturn;
export function useRpc(
  methodNameOrSession?: string | UseSessionReturn,
  handlerOrMethodName?: RpcHandler<any, any> | string,
  optionsOrHandler?: UseRpcOptions<Schema<any, any>> | RpcHandler<any, any>,
  maybeOptions?: UseRpcOptions<Schema<any, any>>,
): UseRpcReturn {
  let session: UseSessionReturn | undefined;
  let methodName: string | undefined;
  let handler: RpcHandler<any, any> | undefined;
  let options: UseRpcOptions<Schema<any, any>> | undefined;

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
      const from = optionsRef.current?.from;
      const fromIdentity = typeof from === 'string' ? from : from?.identity;
      if (fromIdentity && data.callerIdentity !== fromIdentity) {
        throw RpcError.builtIn(
          'UNSUPPORTED_METHOD',
          `Method not available for caller ${data.callerIdentity}`,
        );
      }

      const currentHandler = handlerRef.current;
      if (!currentHandler) {
        throw RpcError.builtIn('APPLICATION_ERROR', `No handler registered for method "${methodName}"`);
      }

      const s = optionsRef.current?.schema ?? schema.json();
      return resolveWithSchema(s, currentHandler, data);
    });

    return () => {
      room.unregisterRpcMethod(methodName);
    };
  }, [room, methodName]);

  // Stable performRpc function
  const performRpc: PerformRpcFn = React.useCallback(
    async (params: RpcCallParams<unknown>, s?: Schema<any, any>) => {
      if (isSchema(s)) {
        let serialized: string;
        try {
          serialized = s.serialize(params.payload);
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
          return s.parse(rawResponse);
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
