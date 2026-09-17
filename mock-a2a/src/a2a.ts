/**
 * The A2A binding, with the LiveKit agent session extension.
 *
 *   POST /<endpoint>/v1/message:stream    SendMessageRequest -> SSE of StreamResponse
 *   POST /<endpoint>/v1/message:send      SendMessageRequest -> Task
 *   GET  /<endpoint>/v1/tasks/<id>        -> Task
 *   POST /<endpoint>/v1/tasks/<id>:cancel CancelTaskRequest -> Task
 *
 * Extension activation (s3.1) decides how much of this the caller sees. When the client
 * sends the URI in A2A-Extensions and we echo it, the stream carries chat_item data parts,
 * lk/verbatim and lk/directive. When it does not, the same task streams as plain A2A: text
 * parts on WORKING statuses and the answer artifact, and nothing else (s3.6).
 *
 * Express 5 routing: the colon verbs MUST be escaped. Unescaped, '/message:stream'
 * silently compiles to a parameter named `stream` that also matches '/messageANYTHING',
 * and '/tasks/:id:cancel' throws at registration ("Missing text before cancel param").
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import * as A2A from './a2a-types.ts';
import { agentCard } from './agent-card.ts';
import { parseChatCtx, lastUserText, type ChatItem } from './chat-items.ts';
import { config } from './config.ts';
import { ConversationStore } from './conversations.ts';
import { runClose, runTask, type ProducedItem, type TurnOutcome } from './engine.ts';
import * as Ext from './extension.ts';
import { endpointNotFound, isServedEndpoint } from './http.ts';
import { resolveScenario, type ScenarioName } from './scenarios.ts';
import { openSse } from './sse.ts';

// ---------------------------------------------------------------------------
// request
// ---------------------------------------------------------------------------

type ParsedMessage = {
  contextId: string;
  messageId: string;
  text: string;
  kind?: 'delegation' | 'close';
  chatCtx?: ChatItem[];
  referenceTaskIds: string[];
  metadata: Record<string, unknown>;
  scenario: ScenarioName;
};

class RequestError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(status: number, reason: string, message: string) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.reason = reason;
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseSendMessage(req: Request, active: boolean): ParsedMessage {
  const body = req.body as Partial<A2A.SendMessageRequest> | undefined;
  if (!body || typeof body !== 'object') {
    throw new RequestError(
      400,
      'INVALID_ARGUMENT',
      'body must be a SendMessageRequest object, e.g. {"message":{...}}',
    );
  }
  const message = body.message;
  if (typeof message !== 'object' || message === null) {
    throw new RequestError(400, 'INVALID_ARGUMENT', 'message is required');
  }

  const parts: A2A.Part[] = Array.isArray(message.parts) ? message.parts : [];
  const text = parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter((value) => value !== '')
    .join('\n')
    .trim();

  // s3.3: contextId is required after the first message. A message without one starts a
  // new conversation, so mint an id rather than rejecting.
  const contextId =
    typeof message.contextId === 'string' && message.contextId
      ? message.contextId
      : `lk-ctx-${crypto.randomUUID()}`;

  const messageMetadata = asObject(message.metadata);
  const requestMetadata = asObject(body.metadata);

  let kind: 'delegation' | 'close' | undefined;
  let chatCtx: ChatItem[] | undefined;

  if (active) {
    const rawKind = messageMetadata[Ext.KIND];
    if (rawKind === Ext.KIND_DELEGATION) kind = 'delegation';
    else if (rawKind === Ext.KIND_CLOSE) kind = 'close';

    for (const part of parts) {
      if (part?.data === undefined) continue;
      if (asObject(part.metadata)[Ext.KIND] !== Ext.KIND_CHAT_CTX) continue;
      chatCtx = parseChatCtx(part.data);
      break;
    }
  } else if (parts.some((part) => part?.data !== undefined)) {
    // The activation rule is strict: unactivated, extension payloads do not exist. Say so
    // loudly, because a forgotten header degrades a delegation into a plain text turn and
    // is otherwise invisible.
    console.warn(
      `[mock-a2a] ignoring a data part: the client did not send "${Ext.EXTENSIONS_HEADER}: ${Ext.EXTENSION_URI}", so the extension is inactive`,
    );
  }

  return {
    contextId,
    messageId: typeof message.messageId === 'string' ? message.messageId : '',
    text,
    kind,
    chatCtx,
    referenceTaskIds: Array.isArray(message.referenceTaskIds)
      ? message.referenceTaskIds.filter((id): id is string => typeof id === 'string')
      : [],
    metadata: requestMetadata,
    scenario: resolveScenario(text, requestMetadata, req.query.scenario),
  };
}

// ---------------------------------------------------------------------------
// projection (s3.4)
// ---------------------------------------------------------------------------

type Projector = {
  working(produced: ProducedItem): void;
  finish(outcome: TurnOutcome): void;
};

function createProjector(options: {
  taskId: string;
  contextId: string;
  active: boolean;
  send: (frame: A2A.StreamResponse) => void;
}): Projector {
  const { taskId, contextId, active, send } = options;

  const chatItemPart = (item: ChatItem): A2A.Part => ({
    data: item,
    metadata: { [Ext.KIND]: Ext.KIND_CHAT_ITEM },
  });

  return {
    /** One WORKING status per chat item the expert produces. */
    working(produced: ProducedItem): void {
      const parts: A2A.Part[] = [];
      if (produced.text) parts.push(A2A.textPart(produced.text));
      if (active) parts.push(chatItemPart(produced.item));

      // Unactivated, an item with no relayed text has nothing a plain client could use.
      if (parts.length === 0) return;

      const message: A2A.Message = {
        messageId: crypto.randomUUID(),
        contextId,
        taskId,
        role: A2A.Role.AGENT,
        parts,
      };
      // lk/verbatim rides the STATUS MESSAGE metadata.
      if (active && produced.verbatim) message.metadata = { [Ext.VERBATIM]: true };

      send({
        statusUpdate: {
          taskId,
          contextId,
          status: { state: A2A.TaskState.WORKING, message, timestamp: A2A.nowIso() },
        },
      });
    },

    finish(outcome: TurnOutcome): void {
      // The answer artifact exists for COMPLETED and INPUT_REQUIRED only -- never for
      // FAILED or CANCELED, and not for a `close` task, which completes with no answer.
      if (outcome.answer) {
        const { text, chunks, verbatim } = outcome.answer;
        const artifactId = crypto.randomUUID();
        // lk/verbatim rides the ARTIFACT metadata here, not the message metadata.
        const metadata = active && verbatim ? { [Ext.VERBATIM]: true } : undefined;
        const pieces = chunks && chunks.length > 0 ? chunks : [text];

        pieces.forEach((piece, index) => {
          const last = index === pieces.length - 1;
          send({
            artifactUpdate: {
              taskId,
              contextId,
              artifact: {
                artifactId,
                name: Ext.ANSWER_ARTIFACT_NAME,
                parts: [A2A.textPart(piece)],
                metadata,
              },
              append: index > 0,
              lastChunk: last,
            },
          });
        });
      }

      // The terminal status. For COMPLETED and INPUT_REQUIRED its message holds the
      // answer's chat item as a data part; for FAILED and CANCELED it holds a text part
      // with the reason or what landed.
      let message: A2A.Message | undefined;
      if (outcome.reason) {
        message = {
          messageId: crypto.randomUUID(),
          contextId,
          taskId,
          role: A2A.Role.AGENT,
          parts: [A2A.textPart(outcome.reason)],
        };
      } else if (active && outcome.answer) {
        message = {
          messageId: crypto.randomUUID(),
          contextId,
          taskId,
          role: A2A.Role.AGENT,
          parts: [chatItemPart(outcome.answer.item)],
        };
      }

      const event: A2A.TaskStatusUpdateEvent = {
        taskId,
        contextId,
        status: { state: outcome.state, message, timestamp: A2A.nowIso() },
      };
      // lk/directive rides the EVENT metadata, and only on COMPLETED.
      if (active && outcome.directive && outcome.state === A2A.TaskState.COMPLETED) {
        event.metadata = { [Ext.DIRECTIVE]: outcome.directive };
      }

      send({ statusUpdate: event });
    },
  };
}

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------

/** The card is unauthenticated: a client reads it before it has a token. */
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
  // fetches. With several endpoints configured the first is the default.
  router.get(`/${A2A.AGENT_CARD_PATH}`, (req, res) => serve(req, res, config.endpoints[0]));
  router.get(`/:endpoint/${A2A.AGENT_CARD_PATH}`, (req, res) =>
    serve(req, res, String(req.params.endpoint)),
  );

  return router;
}

export function a2aRouter(store: ConversationStore): Router {
  const router = express.Router();

  /** Shared prologue: endpoint check, activation, parse, and the task record. */
  const begin = (
    req: Request,
    res: Response,
  ): { parsed: ParsedMessage; active: boolean; taskId: string } | null => {
    if (!isServedEndpoint(req.params.endpoint)) {
      endpointNotFound(res, req.params.endpoint);
      return null;
    }

    const active = Ext.isRequested(req);
    // Echo before anything is written, or a streaming client never sees it.
    if (active) Ext.echoActivation(res);
    res.setHeader(Ext.VERSION_HEADER, Ext.PROTOCOL_VERSION);

    try {
      const parsed = parseSendMessage(req, active);
      return { parsed, active, taskId: crypto.randomUUID() };
    } catch (err) {
      const error = err as RequestError;
      res
        .status(error.status ?? 400)
        .json(A2A.rpcStatus(3, error.message, error.reason ?? 'INVALID_ARGUMENT'));
      return null;
    }
  };

  /** Runs one task to completion, feeding a projector. Shared by :stream and :send. */
  const run = async (
    parsed: ParsedMessage,
    taskId: string,
    projector: Projector,
    controller: AbortController,
  ): Promise<TurnOutcome> => {
    const { contextId } = parsed;

    if (parsed.kind === 'close') {
      const outcome = runClose(contextId, store);
      projector.finish(outcome);
      return outcome;
    }

    // The caller's conversation, deduplicated by item id.
    if (parsed.chatCtx) store.adoptChatCtx(contextId, parsed.chatCtx);

    // "May be empty in a delegation, in which case the expert answers the last user
    // message in the conversation part."
    const said =
      parsed.text || (parsed.kind === 'delegation' ? lastUserText(store.items(contextId)) : '');

    // The caller acknowledged the outstanding questions by sending another message.
    if (parsed.referenceTaskIds.length > 0) store.clearPendingQuestions(contextId);

    const record = store.task(taskId);
    if (record) record.controller = controller;

    let outcome: TurnOutcome;
    try {
      outcome = await runTask({
        contextId,
        store,
        scenario: parsed.scenario,
        said,
        agentName: String(parsed.metadata.agentName ?? config.endpoints[0]),
        isDelegation: parsed.kind === 'delegation',
        signal: controller.signal,
        eventDelayMs: config.eventDelayMs,
        emit: (produced) => projector.working(produced),
      });
    } catch (err) {
      outcome = {
        state: A2A.TaskState.FAILED,
        reason: `The mock expert crashed: ${(err as Error).message}`,
      };
    }

    projector.finish(outcome);
    return outcome;
  };

  router.post('/:endpoint/v1/message\\:stream', (req: Request, res: Response) => {
    const started = begin(req, res);
    if (!started) return;
    const { parsed, active, taskId } = started;
    const { contextId } = parsed;

    const stream = openSse(res, config.heartbeatMs);
    const controller = new AbortController();
    stream.signal.addEventListener('abort', () => controller.abort(stream.signal.reason as Error), {
      once: true,
    });

    // s3.4: the Task is the first event, always. It is sent BEFORE the work is queued --
    // s3.3 has the caller waiting only for this event before sending its next message,
    // which a queued task would otherwise never reach.
    const createdAt = A2A.nowIso();
    store.openTask(contextId, taskId, createdAt);
    stream.send({
      task: {
        id: taskId,
        contextId,
        status: { state: A2A.TaskState.SUBMITTED, timestamp: createdAt },
      },
    } satisfies A2A.StreamResponse);

    const projector = createProjector({
      taskId,
      contextId,
      active,
      send: (frame) => stream.send(frame),
    });

    void store.enqueue(contextId, async () => {
      try {
        const outcome = await run(parsed, taskId, projector, controller);
        store.finishTask(taskId, outcome.state, outcome.answer?.text);
      } finally {
        stream.end();
      }
    });
  });

  router.post('/:endpoint/v1/message\\:send', (req: Request, res: Response) => {
    const started = begin(req, res);
    if (!started) return;
    const { parsed, active, taskId } = started;
    const { contextId } = parsed;

    const artifacts: A2A.Artifact[] = [];
    const history: A2A.Message[] = [];
    let terminal: A2A.TaskStatusUpdateEvent | undefined;

    const projector = createProjector({
      taskId,
      contextId,
      active,
      send: (frame) => {
        if ('artifactUpdate' in frame) artifacts.push(frame.artifactUpdate.artifact);
        else if ('statusUpdate' in frame) {
          if (frame.statusUpdate.status.state === A2A.TaskState.WORKING) {
            if (frame.statusUpdate.status.message) history.push(frame.statusUpdate.status.message);
          } else {
            terminal = frame.statusUpdate;
          }
        }
      },
    });

    const createdAt = A2A.nowIso();
    store.openTask(contextId, taskId, createdAt);
    const controller = new AbortController();

    void store
      .enqueue(contextId, () => run(parsed, taskId, projector, controller))
      .then((outcome) => {
        store.finishTask(taskId, outcome.state, outcome.answer?.text);
        const task: A2A.Task = {
          id: taskId,
          contextId,
          status: terminal?.status ?? { state: outcome.state, timestamp: A2A.nowIso() },
          artifacts,
          history,
        };
        if (terminal?.metadata) task.metadata = terminal.metadata;
        res.status(200).json(task);
      })
      .catch((err: unknown) => {
        res.status(500).json(A2A.rpcStatus(13, (err as Error).message ?? 'unknown error'));
      });
  });

  router.get('/:endpoint/v1/tasks/:id', (req: Request, res: Response) => {
    if (!isServedEndpoint(req.params.endpoint)) {
      endpointNotFound(res, req.params.endpoint);
      return;
    }
    const record = store.task(String(req.params.id));
    if (!record) {
      res.status(404).json(A2A.rpcStatus(5, `no task ${String(req.params.id)}`, 'TASK_NOT_FOUND'));
      return;
    }
    res.status(200).json({
      id: record.taskId,
      contextId: record.contextId,
      status: { state: record.state, timestamp: record.createdAt },
      artifacts: record.answer
        ? [
            {
              artifactId: `${record.taskId}-answer`,
              name: Ext.ANSWER_ARTIFACT_NAME,
              parts: [A2A.textPart(record.answer)],
            },
          ]
        : [],
    } satisfies A2A.Task);
  });

  router.post('/:endpoint/v1/tasks/:id\\:cancel', (req: Request, res: Response) => {
    if (!isServedEndpoint(req.params.endpoint)) {
      endpointNotFound(res, req.params.endpoint);
      return;
    }

    const taskId = String(req.params.id);
    const record = store.task(taskId);
    if (!record) {
      res.status(404).json(A2A.rpcStatus(5, `no task ${taskId}`, 'TASK_NOT_FOUND'));
      return;
    }
    if (A2A.isTerminal(record.state)) {
      res
        .status(400)
        .json(A2A.rpcStatus(3, `task ${taskId} is already ${record.state}`, 'TASK_NOT_CANCELABLE'));
      return;
    }

    // lk/reason rides the CancelTaskRequest metadata. Read it whether or not the extension
    // is active: it costs nothing and a reason is never harmful.
    const reason = String(asObject(req.body)[Ext.REASON] ?? 'cancelled by the caller');
    store.cancelTask(taskId, reason);

    // CancelTask responds with the Task, not 204.
    res.status(200).json({
      id: taskId,
      contextId: record.contextId,
      status: { state: A2A.TaskState.CANCELED, timestamp: A2A.nowIso() },
    } satisfies A2A.Task);
  });

  return router;
}
