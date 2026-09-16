/**
 * The A2A v1.0.1 projection of the native protocol.
 *
 *   POST /<endpoint>/message:stream        SendMessageRequest -> SSE of StreamResponse
 *   POST /<endpoint>/message:send          SendMessageRequest -> Task
 *   POST /<endpoint>/tasks/<id>:cancel     -> Task
 *   GET  /<endpoint>/tasks/<id>:subscribe  -> 501 (the doc: "we need neither yet")
 *
 * This is a serializer over the same engine the native binding drives, so the two cannot
 * disagree about what the agent did. The mapping is the one in s2, "As A2A".
 *
 * What A2A cannot carry, implemented honestly rather than smuggled through:
 *   - The session state. A2A has no field for it, so the conversation is found by
 *     contextId and no snapshot crosses the wire in either direction.
 *   - The caller's id. request_id rides in the request metadata; the task id belongs to
 *     the server. A cancel sent before the first event has no task to name.
 *   - Items that are not text. A function call and a handoff are dropped; a client that
 *     renders them uses the native binding.
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import { AgentSession } from '@livekit/protocol';
import { sessionIdHint } from '../auth.ts';
import { config } from '../config.ts';
import { runTurn } from '../engine.ts';
import { endpointNotFound, isServedEndpoint, sendProtocolError } from '../http.ts';
import {
  parseRunRequest,
  ProtocolError,
  RunCompleteState,
  RunErrorCode,
  type RunEvent,
  type RunRequest,
} from '../protocol.ts';
import { resolveScenario } from '../scenarios.ts';
import { DuplicateRequestError, type SessionStore } from '../sessions.ts';
import { openSse } from '../sse.ts';
import * as A2A from './a2a-types.ts';
import { agentCard } from './agent-card.ts';

function now(): string {
  return new Date().toISOString();
}

/** google.rpc.Status JSON, which is what the v1.0.1 HTTP binding returns for errors. */
function rpcStatus(code: number, message: string, reason?: string): A2A.JsonObject {
  return {
    code,
    message,
    details: reason
      ? [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason,
            domain: 'a2a-protocol.org',
          },
        ]
      : [],
  };
}

function textOf(message: AgentSession.ChatMessage): string {
  return message.content
    .map((part) => (part.payload.case === 'text' ? part.payload.value : ''))
    .join('');
}

type ParsedRequest = {
  runRequest: RunRequest;
  /** Set when the caller continues a task that asked a question. */
  taskId?: string;
};

function parseSendMessage(body: unknown, res: Response, endpoint: string): ParsedRequest {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ProtocolError(
      400,
      'INVALID_ARGUMENT',
      'body must be a SendMessageRequest object, e.g. {"message":{...}}',
    );
  }
  const source = body as Partial<A2A.SendMessageRequest>;
  const message = source.message;
  if (typeof message !== 'object' || message === null) {
    throw new ProtocolError(400, 'INVALID_ARGUMENT', 'message is required');
  }

  const parts: A2A.Part[] = Array.isArray(message.parts) ? message.parts : [];
  const text = parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter((value) => value !== '')
    .join('\n')
    .trim();

  // The chat context arrives as a data part. Marked with the extension URI ideally, with
  // the doc's bare `livekit.chat_ctx` key accepted as an alias, and a lone unmarked data
  // part accepted too because this is a mock and a confusing 400 helps nobody.
  let chatCtx: unknown;
  for (const part of parts) {
    if (part?.data === undefined) continue;
    const metadata = (part.metadata ?? {}) as A2A.JsonObject;
    if (A2A.CHAT_CTX_EXTENSION in metadata || A2A.CHAT_CTX_ALIAS in metadata) {
      chatCtx = part.data;
      break;
    }
  }
  if (chatCtx === undefined) {
    chatCtx = parts.find((part) => part?.data !== undefined)?.data;
  }

  const metadata: A2A.JsonObject =
    source.metadata && typeof source.metadata === 'object' ? { ...source.metadata } : {};
  const rawRequestId = metadata[A2A.REQUEST_ID_METADATA_KEY] ?? metadata.requestId;
  delete metadata[A2A.REQUEST_ID_METADATA_KEY];

  // A2A has no field for the session state, so the conversation is found by contextId.
  const sessionId =
    (typeof message.contextId === 'string' && message.contextId) ||
    sessionIdHint(res) ||
    crypto.randomUUID();

  const nativeBody: Record<string, unknown> = {
    sessionId,
    requestId:
      typeof rawRequestId === 'string' && rawRequestId ? rawRequestId : crypto.randomUUID(),
    agentName: endpoint,
    metadata: JSON.stringify(metadata),
  };
  if (chatCtx !== undefined) {
    nativeBody.delegation = { instruction: text, chatCtx };
  } else {
    nativeBody.text = text;
  }

  return {
    runRequest: parseRunRequest(nativeBody, { fallbackSessionId: sessionId }),
    taskId: typeof message.taskId === 'string' && message.taskId ? message.taskId : undefined,
  };
}

type ProjectorOptions = {
  contextId: string;
  taskId: string;
  /** Reply with one Message frame and open no task at all. */
  bareMessage: boolean;
  send: (frame: A2A.StreamResponse) => void;
};

/** Translates RunResponse events into A2A stream frames. */
function createProjector(options: ProjectorOptions): (event: RunEvent) => void {
  const { contextId, taskId, bareMessage, send } = options;
  const reportCallIds = new Set<string>();

  const status = (state: A2A.TaskState, text?: string): void => {
    send({
      statusUpdate: {
        taskId,
        contextId,
        status: {
          state,
          message: text ? A2A.agentMessage(contextId, taskId, text) : undefined,
          timestamp: now(),
        },
      },
    });
  };

  return (event: RunEvent): void => {
    switch (event.case) {
      case 'functionCall':
        // A call itself has no A2A equivalent. A progress report is different: its text
        // arrives in the paired output, so remember which call id is a report.
        if (event.updateOf !== undefined) reportCallIds.add(event.functionCall.callId);
        return;

      case 'functionCallOutput': {
        if (bareMessage) return;
        // A real tool result is dropped; only a progress report becomes a status event.
        if (!reportCallIds.has(event.functionCallOutput.callId)) return;
        status(A2A.TaskState.WORKING, event.functionCallOutput.output);
        return;
      }

      case 'message': {
        if (bareMessage) return;
        const text = textOf(event.message);
        if (text) status(A2A.TaskState.WORKING, text);
        return;
      }

      case 'agentHandoff':
        return; // no A2A equivalent

      case 'complete': {
        const { complete } = event;
        if (bareMessage) {
          // "A Message reply that opens no task arrives as COMPLETED" -- the inbound
          // reading of this shape. No taskId, because there is no task.
          send({
            message: {
              messageId: crypto.randomUUID(),
              contextId,
              role: A2A.Role.AGENT,
              parts: [A2A.textPart(complete.text)],
            },
          });
          return;
        }

        // "RunComplete becomes an artifact named `answer` and then the status event that
        // ends the task." The session state is not projected: A2A has no field for it.
        send({
          artifactUpdate: {
            taskId,
            contextId,
            artifact: {
              artifactId: crypto.randomUUID(),
              name: 'answer',
              parts: [A2A.textPart(complete.text)],
            },
            append: false,
            lastChunk: true,
          },
        });
        // v1.0.1 has no `final` flag: terminality is a terminal state plus the close.
        status(A2A.toTaskState(complete.state), complete.error?.message);
        return;
      }
    }
  };
}

type TaskRecord = {
  taskId: string;
  contextId: string;
  sessionId: string;
  requestId: string;
  state: A2A.TaskState;
};

/** The card is served unauthenticated: a client reads it before it has a token. */
export function cardRouter(): Router {
  const router = express.Router();

  const serve = (req: Request, res: Response, endpoint: string): void => {
    if (!isServedEndpoint(endpoint)) {
      endpointNotFound(res, endpoint);
      return;
    }
    const base = `${req.protocol}://${req.get('host') ?? `localhost:${config.port}`}`;
    res.type('application/json').json(agentCard(endpoint, base));
  };

  // RFC 8615 well-known URIs are host-rooted, so this is the one a conformant client
  // fetches. With several endpoints on one host the first is the default.
  router.get(`/${A2A.AGENT_CARD_PATH}`, (req, res) => serve(req, res, config.endpoints[0]));

  // The design doc places the card under the endpoint subtree, so serve that too.
  router.get(`/:endpoint/${A2A.AGENT_CARD_PATH}`, (req, res) =>
    serve(req, res, String(req.params.endpoint)),
  );

  return router;
}

export function a2aRouter(store: SessionStore): Router {
  const router = express.Router();
  const tasks = new Map<string, TaskRecord>();

  const start = (
    req: Request,
    res: Response,
  ): {
    parsed: ParsedRequest;
    controller: AbortController;
    taskId: string;
    bare: boolean;
  } | null => {
    const endpoint = req.params.endpoint;
    if (!isServedEndpoint(endpoint)) {
      endpointNotFound(res, endpoint);
      return null;
    }

    let parsed: ParsedRequest;
    try {
      parsed = parseSendMessage(req.body, res, endpoint);
    } catch (err) {
      sendProtocolError(res, err);
      return null;
    }

    let controller: AbortController;
    try {
      controller = store.beginRun(parsed.runRequest.sessionId, parsed.runRequest.requestId);
    } catch (err) {
      if (err instanceof DuplicateRequestError) {
        res.status(409).json(rpcStatus(6, err.message, 'REQUEST_ALREADY_LIVE'));
        return null;
      }
      sendProtocolError(res, err);
      return null;
    }

    const scenario = resolveScenario(parsed.runRequest, req.query.scenario);
    return {
      parsed,
      controller,
      taskId: parsed.taskId ?? crypto.randomUUID(),
      bare: scenario === 'bare-message',
    };
  };

  router.post('/:endpoint/message\\:stream', (req: Request, res: Response) => {
    const started = start(req, res);
    if (!started) return;
    const { parsed, controller, taskId, bare } = started;
    const { runRequest } = parsed;
    const contextId = runRequest.sessionId;

    const stream = openSse(res, config.heartbeatMs);
    stream.signal.addEventListener('abort', () => controller.abort(stream.signal.reason as Error), {
      once: true,
    });

    if (!bare) {
      tasks.set(taskId, {
        taskId,
        contextId,
        sessionId: runRequest.sessionId,
        requestId: runRequest.requestId,
        state: A2A.TaskState.SUBMITTED,
      });
      // A2A requires the server to mint the task id and open the task. v1.0.1 s3.1.2:
      // "the stream MUST begin with the Task object, followed by zero or more
      // TaskStatusUpdateEvent or TaskArtifactUpdateEvent objects."
      stream.send({
        task: {
          id: taskId,
          contextId,
          status: { state: A2A.TaskState.SUBMITTED, timestamp: now() },
        },
      } satisfies A2A.StreamResponse);

      // An immediate "working on it" the client can render while the agent thinks.
      //
      // This is deliberately NOT a bare Message frame. s3.1.2 gives a stream exactly two
      // shapes, and they are mutually exclusive: a Task followed by update events, or
      // "exactly one Message object and then close immediately". A Message frame here
      // would not read as a pre-task greeting -- it would commit the whole turn to the
      // taskless shape and require the stream to end. The spec's own channel for this is
      // the status event: "Agents attach Messages to status update events to inform
      // clients about task progress, request additional input, or provide informational
      // updates."
      if (config.a2aGreeting) {
        stream.send({
          statusUpdate: {
            taskId,
            contextId,
            status: {
              state: A2A.TaskState.WORKING,
              message: A2A.agentMessage(contextId, taskId, config.a2aGreeting),
              timestamp: now(),
            },
          },
        } satisfies A2A.StreamResponse);
      }
    }

    const project = createProjector({
      contextId,
      taskId,
      bareMessage: bare,
      send: (frame) => stream.send(frame),
    });

    void store.enqueue(runRequest.sessionId, async () => {
      try {
        const complete = await runTurn({
          request: runRequest,
          scenario: resolveScenario(runRequest, req.query.scenario),
          signal: controller.signal,
          store,
          eventDelayMs: config.eventDelayMs,
          emit: project,
        });
        const record = tasks.get(taskId);
        if (record) record.state = A2A.toTaskState(complete.state);
      } catch (err) {
        project({
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
        store.endRun(runRequest.sessionId, runRequest.requestId);
        stream.end();
      }
    });
  });

  router.post('/:endpoint/message\\:send', (req: Request, res: Response) => {
    const started = start(req, res);
    if (!started) return;
    const { parsed, controller, taskId } = started;
    const { runRequest } = parsed;
    const contextId = runRequest.sessionId;

    const artifacts: A2A.Artifact[] = [];
    const history: A2A.Message[] = [];
    const project = createProjector({
      contextId,
      taskId,
      bareMessage: false,
      send: (frame) => {
        if ('artifactUpdate' in frame) artifacts.push(frame.artifactUpdate.artifact);
        else if ('statusUpdate' in frame && frame.statusUpdate.status.message) {
          history.push(frame.statusUpdate.status.message);
        }
      },
    });

    void store
      .enqueue(runRequest.sessionId, async () => {
        try {
          return await runTurn({
            request: runRequest,
            scenario: resolveScenario(runRequest, req.query.scenario),
            signal: controller.signal,
            store,
            eventDelayMs: 0, // non-streaming: no reason to pace it
            emit: project,
          });
        } finally {
          store.endRun(runRequest.sessionId, runRequest.requestId);
        }
      })
      .then((complete) => {
        const state = A2A.toTaskState(complete.state);
        tasks.set(taskId, {
          taskId,
          contextId,
          sessionId: runRequest.sessionId,
          requestId: runRequest.requestId,
          state,
        });
        res.status(200).json({
          id: taskId,
          contextId,
          status: {
            state,
            message: complete.error
              ? A2A.agentMessage(contextId, taskId, complete.error.message)
              : undefined,
            timestamp: now(),
          },
          artifacts,
          history,
        } satisfies A2A.Task);
      })
      .catch((err: unknown) => {
        res.status(500).json(rpcStatus(13, (err as Error).message ?? 'unknown error'));
      });
  });

  router.post('/:endpoint/tasks/:id\\:cancel', (req: Request, res: Response) => {
    if (!isServedEndpoint(req.params.endpoint)) {
      endpointNotFound(res, req.params.endpoint);
      return;
    }

    const record = tasks.get(String(req.params.id));
    if (!record) {
      // "A cancel sent before the first event has no task to name" -- also what a client
      // sees if it invents an id.
      res.status(404).json(rpcStatus(5, `no task ${String(req.params.id)}`, 'TASK_NOT_FOUND'));
      return;
    }

    if (A2A.isTerminal(record.state)) {
      res
        .status(400)
        .json(
          rpcStatus(3, `task ${record.taskId} is already ${record.state}`, 'TASK_NOT_CANCELABLE'),
        );
      return;
    }

    store.cancelRun(record.sessionId, record.requestId, 'cancelled via A2A CancelTask');
    record.state = A2A.TaskState.CANCELED;

    // CancelTask responds with the Task, not 204.
    res.status(200).json({
      id: record.taskId,
      contextId: record.contextId,
      status: { state: A2A.TaskState.CANCELED, timestamp: now() },
    } satisfies A2A.Task);
  });

  router.get('/:endpoint/tasks/:id\\:subscribe', (_req: Request, res: Response) => {
    // s2: "A2A defines two more calls, and we need neither yet. One sends more input into
    // a task that asked a question" -- that arrives here as a new message:stream carrying
    // taskId -- "the other re-attaches to a task whose stream dropped", which is this.
    res
      .status(501)
      .json(rpcStatus(12, 'resubscribe is not implemented by this mock', 'NOT_IMPLEMENTED'));
  });

  return router;
}
