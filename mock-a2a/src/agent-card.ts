/**
 * The A2A agent card, per s3.1 of the extension spec.
 *
 * "The card is what a client reads before it calls." It lists one skill named `delegate`,
 * because the expert is one agent and there is nothing to route to, and it declares the
 * extension in capabilities.extensions with required: false -- a client that does not know
 * the extension still gets a working text agent.
 *
 * The interface URL is the endpoint prefix plus /v1, which is where the four routes live.
 */

import { config } from './config.ts';
import { EXTENSION_URI, PROTOCOL_VERSION } from './extension.ts';
import type { JsonObject } from './a2a-types.ts';

export function agentCard(endpoint: string, baseUrl: string): JsonObject {
  return {
    name: endpoint,
    // The description is the part that matters: another agent reads it to decide whether
    // to call this one. Instructions are not a description.
    description: config.agentDescription,
    version: '1.0.0',
    capabilities: {
      streaming: true,
      extensions: [
        {
          uri: EXTENSION_URI,
          description:
            'LiveKit agent session profile: conversation context, typed chat items, ' +
            'verbatim text, directives.',
          required: false,
        },
      ],
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
      {
        id: 'delegate',
        name: 'delegate',
        description: config.agentDescription,
        tags: ['delegation'],
      },
    ],
    supportedInterfaces: [
      {
        url: `${baseUrl}/${endpoint}/v1`,
        protocolBinding: 'HTTP+JSON',
        protocolVersion: PROTOCOL_VERSION,
      },
    ],
    // Not in the spec's example, which does not address auth. This mock verifies a LiveKit
    // access token, so the card has to say so -- securitySchemes is plain A2A.
    securitySchemes: {
      bearer: {
        httpAuthSecurityScheme: {
          description: 'A LiveKit access token.',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    securityRequirements: [{ bearer: [] }],
  };
}
