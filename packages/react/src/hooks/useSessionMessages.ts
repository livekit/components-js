import { UseSessionReturn } from './useSession';
import { useThreadMessages, type UseThreadMessagesReturn } from './useThreadMessages';

/**
 * @deprecated Use {@link useThreadMessages}. `useSessionMessages` is a backwards-compatible alias that
 * resolves the thread from the passed session (or a Session/Thread provider in context) and delegates
 * to `useThreadMessages`.
 * @beta
 */
export type UseSessionMessagesReturn = UseThreadMessagesReturn;

/**
 * A session's messages. Backwards-compatible alias of {@link useThreadMessages}: it resolves the thread
 * from the passed session's `internal.thread` back-reference (or a Session/Thread provider in context)
 * and returns the thread's messages.
 * @deprecated Use {@link useThreadMessages}.
 * @beta
 */
export function useSessionMessages(session?: UseSessionReturn): UseSessionMessagesReturn {
  return useThreadMessages(session?.internal.thread);
}
