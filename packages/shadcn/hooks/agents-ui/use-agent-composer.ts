import { useCallback, useRef, useState } from 'react';

export type AgentComposerStatus = 'idle' | 'sending' | 'error';

export interface UseAgentComposerProps {
  /** Sends the message. If it rejects, the text is restored and the status becomes `error`. */
  onSend: (message: string) => void | Promise<void>;
  /** The text in the composer, when controlled. */
  value?: string;
  /** The initial text in the composer, when uncontrolled. */
  defaultValue?: string;
  /** Called whenever the text changes. */
  onValueChange?: (value: string) => void;
  /** Prevents sending. */
  disabled?: boolean;
  /** The maximum number of characters in a message. */
  maxLength?: number;
  /** Called when `onSend` rejects. */
  onError?: (error: unknown) => void;
}

export interface UseAgentComposerReturn {
  value: string;
  setValue: (value: string) => void;
  /** Sends the current text, if `canSubmit` is true. */
  submit: () => Promise<void>;
  /** Whether the current text can be sent right now. */
  canSubmit: boolean;
  status: AgentComposerStatus;
  disabled: boolean;
  maxLength?: number;
}

/**
 * Headless state for a message composer. The text clears as soon as a message is sent and comes
 * back if sending fails. Typing stays enabled while a message is sending, but a second message
 * can't be sent until the first one finishes.
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
  const [status, setStatus] = useState<AgentComposerStatus>('idle');
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;
  // The latest text set through `setValue`, read after `onSend` settles, when `value` is stale
  const valueRef = useRef(value);

  const setValue = useCallback(
    (next: string) => {
      valueRef.current = next;
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const message = value.trim();
  const canSubmit =
    !disabled &&
    status !== 'sending' &&
    message.length > 0 &&
    (maxLength === undefined || message.length <= maxLength);

  const submit = useCallback(async () => {
    if (!canSubmit) return;

    setStatus('sending');
    setValue('');

    try {
      await onSend(message);
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      // Don't overwrite anything typed while the message was sending
      if (valueRef.current === '') setValue(message);
      onError?.(error);
    }
  }, [canSubmit, message, onSend, onError, setValue]);

  return { value, setValue, submit, canSubmit, status, disabled, maxLength };
}
