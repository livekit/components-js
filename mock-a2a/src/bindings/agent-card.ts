/**
 * The A2A agent card. "The card is what a client reads before it calls. We build it from
 * the endpoint name and the description on the registration. It lists one skill, because
 * there is one agent and nothing to route to."
 *
 * v1.0.1 shape (see a2a-types.ts for the source): no top-level url / preferredTransport /
 * protocolVersion, security schemes are oneof-wrapped, and interfaces carry their own
 * version. AgentInterface.tenant is the spec's own way to say what the design doc calls
 * an endpoint.
 */

import { config } from '../config.ts';
import { A2A_PROTOCOL_VERSION, CHAT_CTX_EXTENSION, type JsonObject } from './a2a-types.ts';

export function agentCard(endpoint: string, baseUrl: string): JsonObject {
  return {
    name: `LiveKit mock agent (${endpoint})`,
    // The description is the part that matters, because another agent reads it to decide
    // whether to call this one. Instructions are not a description.
    description: config.agentDescription,
    supportedInterfaces: [
      {
        url: baseUrl,
        protocolBinding: 'HTTP+JSON',
        tenant: endpoint,
        protocolVersion: A2A_PROTOCOL_VERSION,
      },
    ],
    version: '0.1.0',
    capabilities: {
      streaming: true,
      pushNotifications: false,
      extensions: [
        {
          uri: CHAT_CTX_EXTENSION,
          description:
            'Carries a livekit.agent.ChatContext as a data part, so a delegating agent ' +
            'can hand over the conversation it owns.',
          required: false,
        },
      ],
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
      {
        id: 'run',
        name: 'Agent run',
        description: config.agentDescription,
        tags: ['text', 'chat'],
      },
    ],
    securitySchemes: {
      // oneof-wrapped in v1.0 -- NOT { "type": "http" } as in v0.3.
      bearer: {
        httpAuthSecurityScheme: {
          description: 'A LiveKit access token.',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // The proto field is security_requirements = 9 with no json_name, so strict ProtoJSON
    // says securityRequirements; the spec's own sample card emits `security`. We emit the
    // strict spelling and accept either on read.
    securityRequirements: [{ bearer: [] }],
  };
}
