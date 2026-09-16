/**
 * Server-sent events, as the design doc specifies the transport: "The caller sends one
 * POST and reads server-sent events until the run ends."
 *
 * Everything here was measured on express 5.2.1 / Node 22, not assumed:
 *
 *   - flushHeaders() is required. Without it the headers wait for the first res.write,
 *     so a client that awaits response headers before subscribing stalls.
 *   - res.write needs no explicit flush; res.flush only exists when `compression` is
 *     mounted, and compression must NOT be mounted on a stream.
 *   - req.on('close') and res.on('close') BOTH fire, on both normal completion and a
 *     client abort, so 'close' alone cannot tell you why. res.writableEnded can:
 *     true means we ended it, false means the client vanished.
 *   - Node's own timeouts will not kill a long stream (requestTimeout is cleared once
 *     the request has been fully received). Proxies will -- nginx proxy_read_timeout and
 *     most cloud load balancers default to 60s -- hence the heartbeat comment.
 */

import type { Response } from 'express';

export type SseStream = {
  /** Write one JSON object as a `data:` frame. */
  send(data: unknown): void;
  /** Write an SSE comment. Keeps intermediaries from buffering; clients ignore it. */
  comment(text: string): void;
  end(): void;
  readonly signal: AbortSignal;
};

export function openSse(res: Response, heartbeatMs: number): SseStream {
  const controller = new AbortController();

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.socket?.setNoDelay(true);
  res.flushHeaders();

  let finished = false;

  const heartbeat =
    heartbeatMs > 0
      ? setInterval(() => {
          if (!finished && !res.writableEnded) res.write(': ping\n\n');
        }, heartbeatMs)
      : undefined;
  heartbeat?.unref();

  const stopHeartbeat = (): void => {
    if (heartbeat) clearInterval(heartbeat);
  };

  res.on('close', () => {
    stopHeartbeat();
    if (!res.writableEnded) controller.abort(new Error('client disconnected'));
  });

  return {
    send(data: unknown): void {
      if (finished || res.writableEnded) return;
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
    comment(text: string): void {
      if (finished || res.writableEnded) return;
      res.write(`: ${text}\n\n`);
    },
    end(): void {
      if (finished) return;
      finished = true;
      stopHeartbeat();
      res.end();
    },
    signal: controller.signal,
  };
}
