import * as React from 'react';
import {
  RpcError,
  type RpcInvocationData,
  type PerformRpcParams,
  type Serializer,
  isSerializer,
  type SerializerInput,
  type SerializerOutput,
  serializers,
} from 'livekit-client';

import { useEnsureSession } from '../context';
import { isUseSessionReturn, type UseSessionReturn } from './useSession';

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
 * Options for {@link (useRpc:1)}.
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
export type RpcPerformFn = {
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
  perform: RpcPerformFn;
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
/** @beta */
export function useRpc<S extends Serializer<any, any>>(
  methodName: string,
  handler: RpcHandler<SerializerInput<S>, SerializerOutput<S>>,
  options?: UseRpcOptions<S>,
): UseRpcReturn;
/** @beta */
export function useRpc(session: UseSessionReturn): UseRpcReturn;
/** @beta */
export function useRpc(): UseRpcReturn;
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

  // Stable rpc calling function
  const performRpc: RpcPerformFn = React.useCallback(
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

  return React.useMemo(() => ({ perform: performRpc }), [performRpc]);
}
