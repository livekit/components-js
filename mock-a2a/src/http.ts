/** Small shared helpers. */

import type { Response } from 'express';
import { config } from './config.ts';
import { rpcStatus } from './a2a-types.ts';

export function isServedEndpoint(name: unknown): name is string {
  return typeof name === 'string' && config.endpoints.includes(name);
}

export function endpointNotFound(res: Response, name: unknown): void {
  res
    .status(404)
    .json(
      rpcStatus(
        5,
        `no agent is registered at ${JSON.stringify(String(name))}; this mock serves: ` +
          `${config.endpoints.join(', ')} (set MOCK_ENDPOINTS to change)`,
        'ENDPOINT_NOT_FOUND',
      ),
    );
}
