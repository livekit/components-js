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

/**
 * A {@link Schema} with a bound value — used to associate a handler or payload
 * with its schema in a single object.
 *
 * @beta
 */
export type BoundSchema<S extends Schema<any, any>, V> = S & { value: V };

function isSchema(v: unknown): v is Schema<any, any> {
  return (
    typeof v === 'object' &&
    v !== null &&
    'symbol' in v &&
    (v as Record<string, unknown>)['symbol'] === SchemaSymbol
  );
}

function isBoundSchema(v: unknown): v is BoundSchema<Schema<any, any>, unknown> {
  return isSchema(v) && 'value' in (v as object);
}

// ---------------------------------------------------------------------------
// schema namespace
// ---------------------------------------------------------------------------

/**
 * Schema helpers for RPC payload encoding.
 *
 * Each function has three call forms:
 * - **No argument** — returns a plain `Schema` for use as a `defaultSchema` option or manual use
 * - **Handler argument** — infers `Input`/`Output` from the handler, returns a `BoundSchema`
 *   for inline registration in {@link useRpc}
 * - **Any other value** — returns a `BoundSchema` with that value attached (e.g. for `performRpc`)
 *
 * @example
 * ```ts
 * // Inline handler — types inferred
 * useRpc({ myMethod: schema.json(async (payload: MyInput) => myOutput) });
 *
 * // Override default schema for all plain handlers in this hook
 * useRpc({ myMethod: async (payload) => payload }, { defaultSchema: schema.raw() });
 *
 * // Manual schema instances
 * const a = schema.raw();                             // Schema<string, string>
 * const b = schema.json<{ foo: string }, { bar: string }>(); // Schema<{ foo: string }, { bar: string }>
 * const c = schema.json<{ foo: string }, { bar: string }>(myPayload); // BoundSchema<..., typeof myPayload>
 * ```
 *
 * @beta
 */
export const schema = (() => {
  /**
   * JSON schema — `JSON.parse` on the way in, `JSON.stringify` on the way out.
   * Defaults to `any` so individual handlers can annotate their own payload types.
   */
  function json<Input, Output>(
    handler: RpcHandler<Input, Output>,
  ): BoundSchema<Schema<Input, Output>, RpcHandler<Input, Output>>;
  function json<Input = any, Output = any>(): Schema<Input, Output>;
  function json<Input = any, Output = any, Value = unknown>(
    value: Value,
  ): BoundSchema<Schema<Input, Output>, Value>;
  function json<Input, Output, Value>(value?: Value): unknown {
    const s: Schema<Input, Output> = {
      symbol: SchemaSymbol,
      parse: (raw: string) => JSON.parse(raw) as Input,
      serialize: (val: unknown) => JSON.stringify(val),
    };
    if (typeof value === 'undefined') return s;
    return { ...s, value };
  }

  /** Raw string schema — passes payloads through as plain strings with no encoding. */
  function raw(
    handler: RpcHandler<string, string>,
  ): BoundSchema<Schema<string, string>, RpcHandler<string, string>>;
  function raw(): Schema<string, string>;
  function raw<Value = unknown>(value: Value): BoundSchema<Schema<string, string>, Value>;
  function raw<Value>(value?: Value): unknown {
    const s: Schema<string, string> = {
      symbol: SchemaSymbol,
      parse: (raw: string) => raw,
      serialize: (val: string) => val,
    };
    if (typeof value === 'undefined') return s;
    return { ...s, value };
  }

  return { json, raw };
})();

// ---------------------------------------------------------------------------
// RPC types
// ---------------------------------------------------------------------------

/** @beta */
export type RpcHandler<Input = any, Output = any> = (
  payload: Input,
  data: RpcInvocationData,
) => Promise<Output>;

// Extract Input/Output from a Schema type for use in method map constraints.
type SchemaInput<S> = S extends Schema<infer I, any> ? I : any;
type SchemaOutput<S> = S extends Schema<any, infer O> ? O : any;

/**
 * A method entry for {@link useRpc}: either a plain handler (typed by the
 * `defaultSchema`) or a `BoundSchema` that carries its own schema alongside
 * the handler.
 *
 * @beta
 */
export type RpcMethod<Input = any, Output = any> =
  | RpcHandler<Input, Output>
  | BoundSchema<Schema<Input, Output>, RpcHandler<Input, Output>>;

/**
 * Parameters for an outbound {@link PerformRpcFn} call.
 *
 * `schema` is from the *sender's* perspective: `parse` decodes the *response*
 * (`Output`) and `serialize` encodes the *request* (`Input`). This is the
 * type-flipped counterpart of the handler's schema — for symmetric schemas like
 * `schema.json()` and `schema.raw()` the flip is invisible.
 *
 * @beta
 */
export type PerformRpcDescriptor<Input = string, Output = string> = Omit<
  PerformRpcParams,
  'payload'
> & {
  schema?: Schema<Output, Input>;
  payload: Input;
};

/**
 * Options for {@link useRpc}.
 * @beta
 */
export type UseRpcOptions<S extends Schema<any, any> = Schema<any, any>> = {
  /** Only accept RPCs from this participant. Others will receive UNSUPPORTED_METHOD. */
  from?: string | Participant;
  /**
   * Schema applied to plain handler entries that don't carry their own schema.
   * Defaults to `schema.json()`.
   */
  defaultSchema?: S;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function resolveWithSchema(
  s: Schema<any, any>,
  handler: RpcHandler<any, any>,
  data: RpcInvocationData,
): Promise<string> {
  let parsed: unknown;
  try {
    parsed = s.parse(data.payload);
  } catch (e) {
    throw RpcError.builtIn('APPLICATION_ERROR', `Failed to parse RPC payload: ${e}`);
  }

  const result = await handler(parsed, data);

  try {
    return s.serialize(result);
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
  <Input = string, Output = string>(params: PerformRpcDescriptor<Input, Output>): Promise<Output>;
};

/** @beta */
export type UseRpcReturn = {
  performRpc: PerformRpcFn;
};

// The methods record — plain handler types are constrained by the default schema.
type RpcMethodMap<S extends Schema<any, any>> = Record<
  string,
  | RpcHandler<SchemaInput<S>, SchemaOutput<S>>
  | BoundSchema<Schema<any, any>, RpcHandler<any, any>>
>;

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
  methods?: RpcMethodMap<S>,
  options?: UseRpcOptions<S>,
): UseRpcReturn;
export function useRpc<S extends Schema<any, any> = Schema<any, any>>(
  methods?: RpcMethodMap<S>,
  options?: UseRpcOptions<S>,
): UseRpcReturn;
export function useRpc(
  methodsOrSession?: RpcMethodMap<any> | UseSessionReturn,
  optionsOrMethods?: UseRpcOptions<any> | RpcMethodMap<any>,
  maybeOptions?: UseRpcOptions<any>,
): UseRpcReturn {
  let methods: RpcMethodMap<any> | undefined;
  let options: UseRpcOptions<any> | undefined;
  let session: UseSessionReturn | undefined;

  if (isUseSessionReturn(methodsOrSession)) {
    session = methodsOrSession;
    methods = optionsOrMethods as RpcMethodMap<any> | undefined;
    options = maybeOptions;
  } else {
    methods = methodsOrSession;
    options = optionsOrMethods as UseRpcOptions<any> | undefined;
  }

  const { room } = useEnsureSession(session);

  // Ref that always holds the latest handlers — updated synchronously on render
  const handlersRef = React.useRef(methods);
  handlersRef.current = methods;

  // Ref that always holds the latest options (for participant filter and defaultSchema)
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

        const entry = handlersRef.current?.[name];
        if (!entry) {
          throw RpcError.builtIn('APPLICATION_ERROR', `No handler registered for method "${name}"`);
        }

        if (isBoundSchema(entry)) {
          // Entry carries its own schema — use it directly
          return resolveWithSchema(entry, entry.value as RpcHandler<any, any>, data);
        } else {
          // Plain handler — apply the default schema (json if unset)
          const s = optionsRef.current?.defaultSchema ?? schema.json();
          return resolveWithSchema(s, entry as RpcHandler<any, any>, data);
        }
      });
    }

    return () => {
      for (const name of names) {
        room.unregisterRpcMethod(name);
      }
    };
  }, [room, methodNamesEffectKey]);

  // Stable performRpc function
  const performRpc: PerformRpcFn = React.useCallback(
    async <Input = string, Output = string>(params: PerformRpcDescriptor<Input, Output>) => {
      let serialized: string;
      if (params.schema) {
        try {
          serialized = params.schema.serialize(params.payload);
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

      if (params.schema) {
        try {
          return params.schema.parse(rawResponse);
        } catch (e) {
          throw RpcError.builtIn('APPLICATION_ERROR', `Failed to parse RPC response: ${e}`);
        }
      }
      return rawResponse as Output;
    },
    [room],
  );

  return React.useMemo(() => ({ performRpc }), [performRpc]);
}
