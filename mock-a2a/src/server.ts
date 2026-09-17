/**
 * Mock LiveKit expert, served over A2A.
 *
 * Implements "LiveKit Agent Session Extension for A2A": plain A2A, plus the extension's
 * four metadata keys and two data-part payloads when the client activates it with the
 * A2A-Extensions header. See README.md for the routes, the scenario triggers, and what
 * this mock had to assume.
 */

import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { a2aRouter, cardRouter } from './a2a.ts';
import { bearerAuth } from './auth.ts';
import { config } from './config.ts';
import { ConversationStore } from './conversations.ts';
import { EXTENSION_URI } from './extension.ts';
import { rpcStatus } from './a2a-types.ts';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');

  const store = new ConversationStore();

  // A2A v1.0.1 prefers application/a2a+json. Express 5 leaves req.body as `undefined`
  // (not {}) for a content type the parser does not claim, which turns a validation
  // failure into a TypeError, so claim all three spellings.
  app.use(
    express.json({
      type: ['application/json', 'application/a2a+json', 'application/*+json'],
      limit: '4mb',
    }),
  );

  // Deliberately no compression middleware: it buffers server-sent events, and working
  // around that means calling res.flush() on every frame.

  // The cards go first: unauthenticated, and ahead of any '/:endpoint' route.
  app.use(cardRouter());

  app.use(bearerAuth());
  app.use(a2aRouter(store));

  app.use((req: Request, res: Response) => {
    res.status(404).json(rpcStatus(5, `no route for ${req.method} ${req.path}`, 'ROUTE_NOT_FOUND'));
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[mock-a2a] unhandled error', err);
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(500).json(rpcStatus(13, (err as Error)?.message ?? 'unknown error'));
  });

  return app;
}

function describe(): string {
  const lines = [
    `mock-a2a listening on http://localhost:${config.port}`,
    `  endpoints     ${config.endpoints.join(', ')}`,
    `  extension     ${EXTENSION_URI}`,
    `                active per-request, when the client sends it in A2A-Extensions`,
    `  scenario      ${config.defaultScenario} (override with ?scenario=, metadata.mockScenario, or /ask //say //end ...)`,
    `  event delay   ${config.eventDelayMs}ms`,
    `  say() text    ${config.a2aGreeting ? JSON.stringify(config.a2aGreeting) : '(disabled)'}`,
    `  grant needed  ${config.requireGrant || '(signature and expiry only)'}`,
    '',
    'routes',
  ];
  for (const endpoint of config.endpoints) {
    lines.push(
      `  POST /${endpoint}/v1/message:stream        SendMessageRequest -> SSE`,
      `  POST /${endpoint}/v1/message:send          SendMessageRequest -> Task`,
      `  GET  /${endpoint}/v1/tasks/{id}            -> Task`,
      `  POST /${endpoint}/v1/tasks/{id}:cancel     -> Task`,
      `  GET  /${endpoint}/.well-known/agent-card.json   the card (no auth)`,
    );
  }
  lines.push('  GET  /.well-known/agent-card.json               the card, host-rooted (no auth)');
  return lines.join('\n');
}

// Only listen when run directly, so tests and scripts can import createApp().
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const server = createApp().listen(config.port, () => {
    console.log(describe());
  });
  // Node will not time a long SSE response out on its own, but be explicit about it.
  server.requestTimeout = 0;
  server.headersTimeout = 60_000;
}
