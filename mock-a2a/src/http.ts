/** Small shared helpers for both bindings. */

import type { Response } from 'express';
import { config } from './config.ts';
import { ProtocolError } from './protocol.ts';

export function isServedEndpoint(name: unknown): name is string {
  return typeof name === 'string' && config.endpoints.includes(name);
}

export function endpointNotFound(res: Response, name: unknown): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message:
        `no agent is registered at ${JSON.stringify(String(name))}; ` +
        `this mock serves: ${config.endpoints.join(', ')} (set MOCK_ENDPOINTS to change)`,
    },
  });
}

/** Turn a parse failure into a status code. Only valid before any bytes are written. */
export function sendProtocolError(res: Response, err: unknown): void {
  if (err instanceof ProtocolError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  res.status(500).json({
    error: { code: 'INTERNAL', message: (err as Error).message ?? 'unknown error' },
  });
}
