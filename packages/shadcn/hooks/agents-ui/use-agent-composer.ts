import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export interface UseAgentComposerProps {
  /**
   * Sends the message. The composer clears right away and doesn't wait for it, so show sending and
   * failed states with the message itself, as `useChat` does with each message's `status`.
   */
  onSend: (message: string) => void | Promise<void>;
  /** The text in the composer, when controlled. */
  value?: string;
  /** The initial text in the composer, when uncontrolled. */
  defaultValue?: string;
  /** Called whenever the text changes. */
  onValueChange?: (value: string) => void;
  /** Prevents sending. */
  disabled?: boolean;
  /**
   * The maximum number of characters in a message. Typing past it is allowed, but sending isn't
   * until the message is short enough.
   */
  maxLength?: number;
  /** Called when `onSend` rejects. */
  onError?: (error: unknown) => void;
  /**
   * Keeps unsent text in session storage under this key, so it survives the composer closing or
   * the page reloading. Use a key per conversation. Only for uncontrolled composers.
   */
  draftKey?: string;
}

export interface UseAgentComposerReturn {
  value: string;
  setValue: (value: string) => void;
  /** Sends the current text, if `canSubmit` is true, and clears it. */
  submit: () => void;
  /** Whether the current text can be sent. */
  canSubmit: boolean;
  disabled: boolean;
  maxLength?: number;
  /** Characters left before `maxLength`, negative when over it. Undefined without `maxLength`. */
  remaining?: number;
}

function readDraft(key: string) {
  try {
    return window.sessionStorage.getItem(key) ?? undefined;
  } catch {
    // Storage can be unavailable, such as in private windows or during server rendering
    return undefined;
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // Drafts are a convenience, so a failed write is fine to skip
  }
}

/**
 * Headless state for a message composer. Sending clears the text right away, without waiting for
 * the send to finish, so you can send the next message immediately.
 *
 * @example
 * ```tsx
 * const { send } = useChat();
 * const { value, setValue, submit, canSubmit } = useAgentComposer({ onSend: send });
 * ```
 */
export function useAgentComposer({
  onSend,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  disabled = false,
  maxLength,
  onError,
  draftKey,
}: UseAgentComposerProps): UseAgentComposerReturn {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;

  // Drafts load after mount, so the first render matches server-rendered HTML. A new `draftKey`
  // loads that conversation's draft, or clears the field if it has none.
  const loadedDraftKeyRef = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    if (!draftKey || isControlled || loadedDraftKeyRef.current === draftKey) return;

    const isFirstLoad = loadedDraftKeyRef.current === undefined;
    loadedDraftKeyRef.current = draftKey;
    const draft = readDraft(draftKey);
    if (draft !== undefined) setUncontrolledValue(draft);
    else if (!isFirstLoad) setUncontrolledValue('');
  }, [draftKey, isControlled]);

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
        if (draftKey) writeDraft(draftKey, next);
      }
      onValueChange?.(next);
    },
    [isControlled, draftKey, onValueChange],
  );

  const message = value.trim();
  const remaining = maxLength === undefined ? undefined : maxLength - message.length;
  const canSubmit = !disabled && message.length > 0 && (remaining === undefined || remaining >= 0);

  const submit = useCallback(() => {
    if (!canSubmit) return;

    setValue('');
    Promise.resolve()
      .then(() => onSend(message))
      .catch((error: unknown) => onError?.(error));
  }, [canSubmit, message, onSend, onError, setValue]);

  return { value, setValue, submit, canSubmit, disabled, maxLength, remaining };
}
