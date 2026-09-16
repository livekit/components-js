/**
 * The native binding: "one POST, and SSE back".
 *
 *   POST /<endpoint>          RunRequest -> text/event-stream of RunResponse
 *   POST /<endpoint>:cancel   CancelRunRequest -> 202
 *
 * The cancel route is NOT in the design doc. s3's table lists only the bare POST, the two
 * A2A paths and the card, while s2 defines CancelRunRequest and requires that a cancel be
 * a separate request ("The caller can be gone when the cancel is needed, so nothing
 * depends on the first connection still being open"). The colon-verb spelling mirrors
 * A2A's own /{tenant}/tasks/{id}:cancel. See README, "gaps in the spec".
 *
 * Express 5 routing note: ':cancel' must be escaped as '\\:cancel'. Unescaped,
 * path-to-regexp v8 reads ':cancel' as a parameter -- '/:endpoint/message:stream' does
 * not throw, it silently compiles to a param named `stream` that also matches
 * '/ep/messageANYTHING'. The two-adjacent-params form '/tasks/:id:cancel' throws outright.
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import { sessionIdHint } from '../auth.ts';
import { config } from '../config.ts';
import { runTurn } from '../engine.ts';
import { endpointNotFound, isServedEndpoint, sendProtocolError } from '../http.ts';
import {
  encodeRunResponse,
  parseCancelRunRequest,
  parseRunRequest,
  RunCompleteState,
  RunErrorCode,
  type RunEvent,
  type RunRequest,
} from '../protocol.ts';
import { resolveScenario } from '../scenarios.ts';
import { DuplicateRequestError, type SessionStore } from '../sessions.ts';
import { openSse } from '../sse.ts';

export function nativeRouter(store: SessionStore): Router {
  const router = express.Router();

  // Registered before '/:endpoint', which would otherwise also match the literal path
  // '/fare-desk:cancel' -- ([^/]+) does not stop at a colon.
  router.post('/:endpoint\\:cancel', (req: Request, res: Response) => {
    if (!isServedEndpoint(req.params.endpoint)) {
      endpointNotFound(res, req.params.endpoint);
      return;
    }

    let cancel;
    try {
      cancel = parseCancelRunRequest(req.body, { fallbackSessionId: sessionIdHint(res) });
    } catch (err) {
      sendProtocolError(res, err);
      return;
    }

    const stopped = store.cancelRun(cancel.sessionId, cancel.requestId, cancel.reason);
    // Always 202: "A cancel is best-effort, because work can finish between the decision
    // and the stop." A cancel for a run that already finished is late, not wrong.
    res.status(202).json({ sessionId: cancel.sessionId, requestId: cancel.requestId, stopped });
  });

  router.post('/:endpoint', (req: Request, res: Response) => {
    if (!isServedEndpoint(req.params.endpoint)) {
      endpointNotFound(res, req.params.endpoint);
      return;
    }

    // Everything that can fail with a status code must fail before the stream opens:
    // once SSE headers are out, the only way to report anything is in-band.
    let request: RunRequest;
    try {
      request = parseRunRequest(req.body, { fallbackSessionId: sessionIdHint(res) });
    } catch (err) {
      sendProtocolError(res, err);
      return;
    }

    let controller: AbortController;
    try {
      controller = store.beginRun(request.sessionId, request.requestId);
    } catch (err) {
      if (err instanceof DuplicateRequestError) {
        res.status(409).json({ error: { code: 'ALREADY_EXISTS', message: err.message } });
        return;
      }
      sendProtocolError(res, err);
      return;
    }

    const scenario = resolveScenario(request, req.query.scenario);
    const emitDefaults = !config.omitDefaults;
    const stream = openSse(res, config.heartbeatMs);

    // A vanished client cancels the run it was waiting on.
    stream.signal.addEventListener('abort', () => controller.abort(stream.signal.reason as Error), {
      once: true,
    });

    const send = (event: RunEvent): void => {
      stream.send(encodeRunResponse(request.sessionId, request.requestId, event, emitDefaults));
    };

    // Rule 2: runs of one conversation are taken one at a time, in the order they arrive.
    // Headers are already flushed, so a queued caller sees an open stream and heartbeats
    // until its turn comes.
    void store.enqueue(request.sessionId, async () => {
      try {
        await runTurn({
          request,
          scenario,
          signal: controller.signal,
          store,
          eventDelayMs: config.eventDelayMs,
          emit: send,
        });
      } catch (err) {
        // Rule 1 still has to hold on the failure path.
        send({
          case: 'complete',
          complete: {
            state: RunCompleteState.FAILED,
            text: 'The mock agent crashed while answering.',
            error: {
              message: (err as Error).message ?? 'unknown error',
              code: RunErrorCode.INTERNAL_ERROR,
            },
          },
        });
      } finally {
        store.endRun(request.sessionId, request.requestId);
        stream.end();
      }
    });
  });

  return router;
}
