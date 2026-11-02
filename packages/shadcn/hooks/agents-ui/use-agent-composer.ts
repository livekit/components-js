import { useCallback, useState } from 'react';

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
}: UseAgentComposerProps): UseAgentComposerReturn {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
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
