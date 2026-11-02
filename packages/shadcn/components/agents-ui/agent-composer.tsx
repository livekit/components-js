'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useChat, useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { Loader, SendHorizontal } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  useAgentComposer,
  type UseAgentComposerProps,
  type UseAgentComposerReturn,
} from '@/hooks/agents-ui/use-agent-composer';

interface AgentComposerContextValue extends UseAgentComposerReturn {
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

// `FormEvent` in older React types and `SubmitEvent` in newer ones
type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0];

const AgentComposerContext = createContext<AgentComposerContextValue | null>(null);

function useAgentComposerContext(component: string) {
  const context = useContext(AgentComposerContext);
  if (!context) {
    throw new Error(`${component} must be used inside AgentComposer`);
  }
  return context;
}

/**
 * Props for the AgentComposer component.
 */
export interface AgentComposerProps
  extends
    Omit<ComponentProps<'form'>, 'onError' | 'defaultValue'>,
    Partial<Omit<UseAgentComposerProps, 'onSend'>> {
  /**
   * Sends the message. If it rejects, the text is restored and `data-status` becomes `error`.
   * When omitted, messages go to the session's chat, and the composer is disabled until the
   * session connects.
   */
  onSend?: UseAgentComposerProps['onSend'];
  /**
   * Render as the child element instead of a `<form>`.
   * @defaultValue false
   */
  asChild?: boolean;
}

function AgentComposerRoot({
  onSend,
  value,
  defaultValue,
  onValueChange,
  disabled,
  maxLength,
  onError,
  asChild = false,
  className,
  children,
  onSubmit,
  ...props
}: AgentComposerProps & Pick<UseAgentComposerProps, 'onSend'>) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composer = useAgentComposer({
    onSend,
    value,
    defaultValue,
    onValueChange,
    disabled,
    maxLength,
    onError,
  });
  const Comp = asChild ? Slot.Root : 'form';

  const handleSubmit = (event: FormSubmitEvent) => {
    onSubmit?.(event);
    event.preventDefault();
    // Keep focus in the input when the send button is clicked
    inputRef.current?.focus();
    composer.submit();
  };

  return (
    <AgentComposerContext.Provider value={{ ...composer, inputRef }}>
      <Comp
        data-slot="agent-composer"
        data-status={composer.status}
        data-disabled={composer.disabled ? '' : undefined}
        onSubmit={handleSubmit}
        className={cn('flex items-end gap-2 text-sm', className)}
        {...props}
      >
        {children ?? (
          <>
            <AgentComposerInput />
            <AgentComposerSubmit />
          </>
        )}
      </Comp>
    </AgentComposerContext.Provider>
  );
}

function SessionChatComposer({ disabled, ...props }: AgentComposerProps) {
  const { send } = useChat();
  const connectionState = useConnectionState();

  const handleSend = async (message: string) => {
    await send(message);
  };

  return (
    <AgentComposerRoot
      {...props}
      onSend={handleSend}
      disabled={disabled || connectionState !== ConnectionState.Connected}
    />
  );
}

/**
 * A text input for sending messages to an agent, with a send button. Enter sends and Shift+Enter
 * adds a new line. Pass `AgentComposerInput`, `AgentComposerActions`, and `AgentComposerSubmit` as
 * children to change the layout.
 *
 * Use `data-status` (`idle`, `sending`, or `error`) and `data-disabled` to style each state.
 *
 * @extends ComponentProps<'form'>
 *
 * @example
 * ```tsx
 * <AgentComposer />
 *
 * <AgentComposer onSend={handleSend}>
 *   <AgentComposerInput placeholder="Ask anything" />
 *   <AgentComposerActions>{actions}</AgentComposerActions>
 *   <AgentComposerSubmit />
 * </AgentComposer>
 * ```
 */
export function AgentComposer(props: AgentComposerProps) {
  // Switching between the two remounts the composer, so pick one for its lifetime
  if (props.onSend) {
    return <AgentComposerRoot {...props} onSend={props.onSend} />;
  }
  return <SessionChatComposer {...props} />;
}

/**
 * Props for the AgentComposerInput component.
 */
export type AgentComposerInputProps = Omit<
  ComponentProps<'textarea'>,
  'value' | 'defaultValue' | 'maxLength'
>;

/**
 * The composer's text field. It grows with its content and takes all textarea props.
 *
 * @extends ComponentProps<'textarea'>
 */
export function AgentComposerInput({
  ref,
  disabled,
  className,
  onChange,
  onKeyDown,
  'aria-label': ariaLabel = 'Message',
  ...props
}: AgentComposerInputProps) {
  const {
    value,
    setValue,
    submit,
    maxLength,
    inputRef,
    disabled: composerDisabled,
  } = useAgentComposerContext('AgentComposerInput');

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [inputRef, ref],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // Enter also confirms an input method editor's suggestion (Japanese, Chinese, and others).
    // Safari reports those keypresses with keyCode 229 rather than `isComposing`.
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229;
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault();
      // Go through the form so Enter and the send button share one path, including `onSubmit`
      const form = event.currentTarget.form;
      if (form) form.requestSubmit();
      else submit();
    }
  };

  return (
    <textarea
      ref={setRefs}
      data-slot="agent-composer-input"
      rows={1}
      value={value}
      maxLength={maxLength}
      aria-label={ariaLabel}
      disabled={disabled || composerDisabled}
      onChange={(event) => {
        onChange?.(event);
        setValue(event.target.value);
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        'field-sizing-content max-h-16 min-h-8 flex-1 resize-none bg-transparent py-2 [scrollbar-width:thin] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Props for the AgentComposerActions component.
 */
export interface AgentComposerActionsProps extends ComponentProps<'div'> {
  /**
   * Render as the child element instead of a `<div>`.
   * @defaultValue false
   */
  asChild?: boolean;
}

/**
 * A slot for extra controls beside the input, such as attachments or a voice mode switch.
 *
 * @extends ComponentProps<'div'>
 */
export function AgentComposerActions({
  asChild = false,
  className,
  ...props
}: AgentComposerActionsProps) {
  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      data-slot="agent-composer-actions"
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  );
}

/**
 * Props for the AgentComposerSubmit component.
 */
export type AgentComposerSubmitProps = ComponentProps<typeof Button>;

/**
 * The composer's send button. Shows a spinner while a message is sending. Pass children to
 * replace the icon.
 *
 * @extends ComponentProps<typeof Button>
 */
export function AgentComposerSubmit({
  disabled,
  variant,
  size = 'icon',
  className,
  children,
  'aria-label': ariaLabel = 'Send message',
  ...props
}: AgentComposerSubmitProps) {
  const { canSubmit, status } = useAgentComposerContext('AgentComposerSubmit');
  const isDisabled = disabled || !canSubmit;

  return (
    <Button
      type="submit"
      data-slot="agent-composer-submit"
      size={size}
      disabled={isDisabled}
      variant={variant ?? (isDisabled ? 'secondary' : 'default')}
      aria-label={ariaLabel}
      className={cn('self-end disabled:cursor-not-allowed', className)}
      {...props}
    >
      {children ??
        (status === 'sending' ? <Loader className="animate-spin" /> : <SendHorizontal />)}
    </Button>
  );
}
