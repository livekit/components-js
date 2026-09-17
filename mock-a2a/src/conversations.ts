/**
 * Conversations and their tasks.
 *
 * "Conversation: an A2A context. All messages and tasks of one user's session share its
 * id." One expert instance per conversation, for the conversation's life (s1).
 *
 * The rules this enforces, all from s3.3 and s3.5:
 *   - Tasks of one conversation run one at a time, in order (the FIFO chain).
 *   - A new message while a task runs QUEUES behind it and never cancels. A caller that
 *     wants barge-in sends CancelTask first.
 *   - A cancel is best-effort: work that finished before the stop stays done.
 *   - `lk/kind = close` drops the conversation; the next message on that id starts fresh.
 */

import type { ChatItem } from './chat-items.ts';
import { mergeById } from './chat-items.ts';
import { TaskState, type TaskState as TaskStateValue } from './a2a-types.ts';

export type TaskRecord = {
  taskId: string;
  contextId: string;
  state: TaskStateValue;
  /** Set while the task is running, so a cancel has something to abort. */
  controller?: AbortController;
  /** What the task produced, for GET /v1/tasks/ID. */
  answer?: string;
  createdAt: string;
};

type Conversation = {
  contextId: string;
  /** The expert's own conversation, not the caller's. */
  items: ChatItem[];
  tasks: Map<string, TaskRecord>;
  /** Task ids that ended INPUT_REQUIRED, for the caller's `referenceTaskIds` (s3.3). */
  pendingQuestions: string[];
  /** Tail of the FIFO chain: every task awaits its predecessor. */
  tail: Promise<void>;
};

export class CancelledError extends Error {
  constructor(reason: string) {
    super(reason || 'cancelled by the caller');
    this.name = 'CancelledError';
  }
}

export class ConversationStore {
  #conversations = new Map<string, Conversation>();
  /** Task id -> context id, so a cancel or a fetch can find its conversation. */
  #taskIndex = new Map<string, string>();

  #ensure(contextId: string): Conversation {
    let conversation = this.#conversations.get(contextId);
    if (!conversation) {
      conversation = {
        contextId,
        items: [],
        tasks: new Map(),
        pendingQuestions: [],
        tail: Promise.resolve(),
      };
      this.#conversations.set(contextId, conversation);
    }
    return conversation;
  }

  has(contextId: string): boolean {
    return this.#conversations.has(contextId);
  }

  items(contextId: string): ChatItem[] {
    return this.#ensure(contextId).items;
  }

  /** The expert's own history grows with everything it produces. */
  append(contextId: string, items: ChatItem[]): void {
    if (items.length === 0) return;
    this.#ensure(contextId).items.push(...items);
  }

  /**
   * Fold the caller's conversation in, deduplicating by item id (s3.3). Returns the items
   * that were actually new, which is what makes the dedup observable to a test.
   */
  adoptChatCtx(contextId: string, incoming: ChatItem[]): ChatItem[] {
    return mergeById(this.#ensure(contextId).items, incoming);
  }

  pendingQuestions(contextId: string): string[] {
    return [...this.#ensure(contextId).pendingQuestions];
  }

  /** s3.5: the conversation is over. The server closes the session and forgets it. */
  close(contextId: string): void {
    const conversation = this.#conversations.get(contextId);
    if (!conversation) return;
    for (const taskId of conversation.tasks.keys()) this.#taskIndex.delete(taskId);
    this.#conversations.delete(contextId);
  }

  openTask(contextId: string, taskId: string, createdAt: string): TaskRecord {
    const conversation = this.#ensure(contextId);
    const record: TaskRecord = {
      taskId,
      contextId,
      state: TaskState.SUBMITTED,
      createdAt,
    };
    conversation.tasks.set(taskId, record);
    this.#taskIndex.set(taskId, contextId);
    return record;
  }

  task(taskId: string): TaskRecord | undefined {
    const contextId = this.#taskIndex.get(taskId);
    if (contextId === undefined) return undefined;
    return this.#conversations.get(contextId)?.tasks.get(taskId);
  }

  finishTask(taskId: string, state: TaskStateValue, answer?: string): void {
    const record = this.task(taskId);
    if (!record) return;
    record.state = state;
    record.answer = answer;
    record.controller = undefined;
    if (state === TaskState.INPUT_REQUIRED) {
      const conversation = this.#conversations.get(record.contextId);
      if (conversation && !conversation.pendingQuestions.includes(taskId)) {
        conversation.pendingQuestions.push(taskId);
      }
    }
  }

  /** The caller answered a question, so the pending list resets for the next turn. */
  clearPendingQuestions(contextId: string): void {
    this.#ensure(contextId).pendingQuestions.length = 0;
  }

  /**
   * Queue a task's work behind whatever is already running on this conversation. The
   * caller has already been sent its `Task` event by this point -- s3.3 has the next
   * message waiting only for that event, so a queued task must still be acknowledged
   * immediately or the caller could never send it.
   */
  enqueue<T>(contextId: string, work: () => Promise<T>): Promise<T> {
    const conversation = this.#ensure(contextId);
    const result = conversation.tail.then(work, work);
    conversation.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  /** Best-effort (s3.5). Returns false when there is nothing running to stop. */
  cancelTask(taskId: string, reason: string): boolean {
    const record = this.task(taskId);
    if (!record?.controller) return false;
    record.controller.abort(new CancelledError(reason));
    return true;
  }
}
