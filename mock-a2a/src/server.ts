/**
 * Mock LiveKit agent-run endpoint.
 *
 * Serves the native binding from "Delegation Model with A2A v2" and an A2A v1.0.1
 * projection of it, over one endpoint subtree, gated by a real LiveKit access token.
 * See README.md for the routes, the scenario triggers, and the places where this mock
 * had to assume something the design doc leaves open.
 */

import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { bearerAuth } from './auth.ts';
import { a2aRouter, cardRouter } from './bindings/a2a.ts';
import { nativeRouter } from './bindings/native.ts';
import { config } from './config.ts';
import { SessionStore } from './sessions.ts';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');

  const store = new SessionStore();

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
  app.use(nativeRouter(store));

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: `no route for ${req.method} ${req.path}` },
    });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[mock-a2a] unhandled error', err);
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL', message: (err as Error)?.message ?? 'unknown error' },
    });
  });

  return app;
}

function describe(): string {
  const lines = [
    `mock-a2a listening on http://localhost:${config.port}`,
    `  endpoints        ${config.endpoints.join(', ')}`,
    `  scenario         ${config.defaultScenario} (override with ?scenario=, metadata.mockScenario, or /fail //ask //slow ...)`,
    `  event delay      ${config.eventDelayMs}ms`,
    `  default values   ${config.omitDefaults ? 'OMITTED (strict canonical JSON)' : 'emitted explicitly'}`,
    `  grant required   ${config.requireGrant || '(signature and expiry only)'}`,
    '',
    'routes',
  ];
  for (const endpoint of config.endpoints) {
    lines.push(
      `  POST /${endpoint}                       ours: RunRequest -> SSE of RunResponse`,
      `  POST /${endpoint}:cancel                ours: CancelRunRequest`,
      `  POST /${endpoint}/message:stream        A2A  SendMessageRequest -> SSE`,
      `  POST /${endpoint}/message:send          A2A  SendMessageRequest -> Task`,
      `  POST /${endpoint}/tasks/{id}:cancel     A2A  CancelTask -> Task`,
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
