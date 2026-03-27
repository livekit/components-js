import * as React from 'react';
import { type RpcInvocationData } from 'livekit-client';

import type { UseAgentReturn } from './useAgent';
import { useRpc, type RpcMethod } from './useRpc';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Any object with a `parse` method that validates and returns typed data, and a `toJSONSchema`
 * method that returns a JSON Schema representation.
 *
 * This aligns with zod's interface without depending on it. Zod provides `.parse()` natively
 * and `.toJSONSchema()` via `z.toJSONSchema(schema)`. Other schema libraries can also satisfy
 * this interface with minimal wrapping.
 *
 * @beta
 */
export type SchemaLike<T> = {
  /** Validate and parse the input. Should throw if validation fails. */
  parse: (input: unknown) => T;
  /**
   * Return a JSON Schema representation of the parameters.
   * Must be `{ type: "object", properties: { ... } }` at the top level, since the agent
   * framework maps parameters to Python kwargs / JS named arguments.
   */
  toJSONSchema: () => Record<string, unknown>;
};

/**
 * Definition for a single client tool.
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClientToolDefinition<TParams = any> = {
  /** Description of the tool, presented to the LLM by the agent framework. */
  description: string;

  /**
   * Schema for validating/parsing incoming payloads AND generating JSON Schema for the manifest.
   *
   * Must satisfy the {@link SchemaLike} interface. Compatible with zod schemas and any other
   * library with conforming `parse` and `toJSONSchema` methods.
   */
  parameters: SchemaLike<TParams>;

  /** The function called when the agent invokes this tool. */
  execute: (params: TParams, context: RpcInvocationData) => Promise<unknown>;
};

/** Version of the client tool manifest attribute format. */
const CLIENT_TOOL_MANIFEST_VERSION = 1;

/** Prefix for participant attributes that advertise client tools. */
const CLIENT_TOOL_ATTRIBUTE_PREFIX = 'lk.client_tools.';

// ---------------------------------------------------------------------------
// useClientTools hook
// ---------------------------------------------------------------------------

/**
 * Declares tools that an AI agent can call on the frontend.
 *
 * Each tool's description, parameter schema, and implementation are defined here on the client.
 * The hook publishes the tool manifest as participant attributes so the agent framework can
 * discover them, and registers RPC handlers so the agent can invoke them.
 *
 * On the agent side, each tool is referenced by name via `client_tool(name="toolName")`.
 *
 * @example
 * ```tsx
 * useClientTools(agent, {
 *   getUserLocation: {
 *     description: "Get the user's browser geolocation",
 *     parameters: z.object({ highAccuracy: z.boolean() }),
 *     execute: async ({ highAccuracy }) => {
 *       const pos = await getPosition(highAccuracy);
 *       return { lat: pos.coords.latitude, lng: pos.coords.longitude };
 *     },
 *   },
 * });
 * ```
 *
 * @beta
 */
export function useClientTools(
  agent: UseAgentReturn,
  tools: Record<string, ClientToolDefinition>,
): void {
  const session = agent.internal.session;
  const { room } = session;

  // --- Ref for latest tool definitions (same pattern as useRpc) ---
  const toolsRef = React.useRef(tools);
  toolsRef.current = tools;

  // --- Convert tool definitions into RpcMethods for useRpc ---
  const rpcMethods = React.useMemo(() => {
    const methods: Record<string, RpcMethod> = {};
    for (const [name, tool] of Object.entries(tools)) {
      methods[name] = {
        parse: (raw: string) => {
          const parsed = JSON.parse(raw);
          return tool.parameters.parse(parsed);
        },
        serialize: (val: unknown) => JSON.stringify(val),
        handler: async (payload: unknown, data: RpcInvocationData) => {
          return toolsRef.current[name]!.execute(payload, data);
        },
      };
    }
    return methods;
  }, [tools]);

  // --- Register RPC handlers via useRpc, scoped to agent participant ---
  useRpc(session, rpcMethods, { from: agent.identity });

  // --- Publish tool manifest as participant attributes ---
  const toolNamesKey = React.useMemo(() => Object.keys(tools).sort().join('\0'), [tools]);

  React.useEffect(() => {
    const attributes: Record<string, string> = {};
    for (const [name, tool] of Object.entries(toolsRef.current)) {
      let jsonSchema: Record<string, unknown>;
      try {
        jsonSchema = tool.parameters.toJSONSchema();
      } catch (e) {
        throw new Error(
          `useClientTools: Failed to generate JSON Schema for tool "${name}". ` +
            `Ensure your parameters schema implements toJSONSchema() correctly: ${e}`,
        );
      }

      const manifest: Record<string, unknown> = {
        version: CLIENT_TOOL_MANIFEST_VERSION,
        description: tool.description,
        parameters: jsonSchema,
      };

      attributes[`${CLIENT_TOOL_ATTRIBUTE_PREFIX}${name}`] = JSON.stringify(manifest);
    }

    room.localParticipant.setAttributes(attributes);

    return () => {
      // Clear attributes on unmount
      const cleared: Record<string, string> = {};
      for (const name of Object.keys(toolsRef.current)) {
        cleared[`${CLIENT_TOOL_ATTRIBUTE_PREFIX}${name}`] = '';
      }
      room.localParticipant.setAttributes(cleared);
    };
  }, [room, toolNamesKey]);
}
