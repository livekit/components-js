'use client';

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useChat, useConnectionState, useTrackToggle } from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import { ArrowUpIcon, MicIcon } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  useAgentComposer,
  type UseAgentComposerProps,
  type UseAgentComposerReturn,
} from '@/hooks/agents-ui/use-agent-composer';

interface AgentComposerContextValue extends UseAgentComposerReturn {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  characterCountId: string;
  listening?: boolean;
  onListeningChange?: (listening: boolean) => void;
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
   * Sends the message. The composer clears right away without waiting for it, so show sending and
   * failed states with the message itself. When omitted, messages go to the session's chat, where
   * each one has a `status`, and the composer is disabled until the session connects.
   */
  onSend?: UseAgentComposerProps['onSend'];
  /**
   * Whether the microphone is on, so the agent can hear you. Without `onSend`, it follows the
   * session's microphone.
   */
  listening?: boolean;
  /**
   * Called when `AgentComposerMicrophone` is toggled. Without `onSend`, it turns the session's
   * microphone on or off. With `onSend`, pass it to show the microphone.
   */
  onListeningChange?: (listening: boolean) => void;
  /** Placeholder text for the default layout's input. */
  placeholder?: string;
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
  listening,
  onListeningChange,
  placeholder,
  asChild = false,
  className,
  children,
  onSubmit,
  ...props
}: AgentComposerProps & Pick<UseAgentComposerProps, 'onSend'>) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const characterCountId = useId();
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
  const isOverLimit = composer.remaining !== undefined && composer.remaining < 0;

  const handleSubmit = (event: FormSubmitEvent) => {
    onSubmit?.(event);
    event.preventDefault();
    // Keep focus in the input when the send button is clicked
    inputRef.current?.focus();
    composer.submit();
  };

  return (
    <AgentComposerContext.Provider
      value={{ ...composer, inputRef, characterCountId, listening, onListeningChange }}
    >
      <Comp
        data-slot="agent-composer"
        data-disabled={composer.disabled ? '' : undefined}
        data-over-limit={isOverLimit ? '' : undefined}
        onSubmit={handleSubmit}
        className={cn('flex flex-col gap-1.5 text-sm', className)}
        {...props}
      >
        {children ??
          (maxLength === undefined ? (
            <AgentComposerField>
              <AgentComposerInput placeholder={placeholder} />
              <AgentComposerMicrophone />
              <AgentComposerSubmit />
            </AgentComposerField>
          ) : (
            // Two rows, so the count has room beside the buttons
            <AgentComposerField className="flex-col items-stretch gap-1">
              <AgentComposerInput placeholder={placeholder} />
              <div className="flex items-center justify-end gap-2">
                <AgentComposerCharacterCount />
                <AgentComposerMicrophone />
                <AgentComposerSubmit />
              </div>
            </AgentComposerField>
          ))}
      </Comp>
    </AgentComposerContext.Provider>
  );
}

function SessionChatComposer({
  disabled,
  listening,
  onListeningChange,
  ...props
}: AgentComposerProps) {
  const { send } = useChat();
  const connectionState = useConnectionState();
  const microphone = useTrackToggle({ source: Track.Source.Microphone });

  const handleSend = async (message: string) => {
    await send(message);
  };

  return (
    <AgentComposerRoot
      {...props}
      onSend={handleSend}
      disabled={disabled || connectionState !== ConnectionState.Connected}
      listening={listening ?? microphone.enabled}
      onListeningChange={(next) => {
        onListeningChange?.(next);
        microphone.toggle(next);
      }}
    />
  );
}

/**
 * A text input for sending messages to an agent, with microphone and send buttons. Enter sends and
 * Shift+Enter adds a new line. With `maxLength`, the buttons and a character count move to a row
 * below the input. Pass parts as children to change the layout: `AgentComposerField` holds
 * `AgentComposerInput`, `AgentComposerActions`, `AgentComposerCharacterCount`,
 * `AgentComposerMicrophone`, and `AgentComposerSubmit`.
 *
 * Use `data-disabled` to style the disabled state, and `data-over-limit` for a message longer than
 * `maxLength`.
 *
 * @extends ComponentProps<'form'>
 *
 * @example
 * ```tsx
 * <AgentComposer />
 *
 * <AgentComposer onSend={handleSend} maxLength={500}>
 *   <AgentComposerField className="flex-col items-stretch rounded-lg border p-2">
 *     <AgentComposerInput placeholder="Ask anything" />
 *     <div className="flex items-center justify-between">
 *       <AgentComposerActions>{actions}</AgentComposerActions>
 *       <AgentComposerActions>
 *         <AgentComposerCharacterCount />
 *         <AgentComposerSubmit />
 *       </AgentComposerActions>
 *     </div>
 *   </AgentComposerField>
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
 * Props for the AgentComposerField component.
 */
export interface AgentComposerFieldProps extends ComponentProps<'div'> {
  /**
   * Render as the child element instead of a `<div>`.
   * @defaultValue false
   */
  asChild?: boolean;
}

/**
 * The visible text box that holds the input and buttons. Style it with a border or background.
 *
 * @extends ComponentProps<'div'>
 */
export function AgentComposerField({
  asChild = false,
  className,
  ...props
}: AgentComposerFieldProps) {
  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      data-slot="agent-composer-field"
      className={cn('flex items-end gap-2', className)}
      {...props}
    />
  );
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
    remaining,
    inputRef,
    characterCountId,
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
      aria-label={ariaLabel}
      aria-invalid={(remaining !== undefined && remaining < 0) || undefined}
      aria-describedby={remaining !== undefined ? characterCountId : undefined}
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
 * Props for the AgentComposerMicrophone component.
 */
export type AgentComposerMicrophoneProps = Omit<
  ComponentProps<typeof Toggle>,
  'pressed' | 'defaultPressed' | 'onPressedChange'
>;

/**
 * Turns the microphone on so the agent can hear you, and off again. It starts off and fills in
 * while listening. Renders nothing when the composer has no `onListeningChange`, which is set for
 * you without `onSend`.
 *
 * @extends ComponentProps<typeof Toggle>
 */
export function AgentComposerMicrophone({
  disabled,
  className,
  children,
  'aria-label': ariaLabel = 'Listen',
  ...props
}: AgentComposerMicrophoneProps) {
  const {
    listening = false,
    onListeningChange,
    disabled: composerDisabled,
  } = useAgentComposerContext('AgentComposerMicrophone');
  if (!onListeningChange) return null;

  return (
    <Toggle
      data-slot="agent-composer-microphone"
      pressed={listening}
      onPressedChange={onListeningChange}
      disabled={disabled || composerDisabled}
      aria-label={ariaLabel}
      className={cn(
        'text-muted-foreground hover:bg-accent hover:text-foreground size-9 cursor-pointer self-end',
        'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        'data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground',
        className,
      )}
      {...props}
    >
      {children ?? <MicIcon />}
    </Toggle>
  );
}

/**
 * Props for the AgentComposerSubmit component.
 */
export type AgentComposerSubmitProps = ComponentProps<typeof Button>;

/**
 * The composer's send button. Pass children to replace the icon.
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
  const { canSubmit } = useAgentComposerContext('AgentComposerSubmit');
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
      {children ?? <ArrowUpIcon />}
    </Button>
  );
}

/**
 * Props for the AgentComposerCharacterCount component.
 */
export type AgentComposerCharacterCountProps = ComponentProps<'div'>;

/**
 * Shows how many characters are left before `maxLength`, usually beside the buttons. The count
 * goes negative past the limit, after an error message. Renders nothing without `maxLength`.
 *
 * @extends ComponentProps<'div'>
 */
export function AgentComposerCharacterCount({
  className,
  ...props
}: AgentComposerCharacterCountProps) {
  const { remaining, characterCountId } = useAgentComposerContext('AgentComposerCharacterCount');
  if (remaining === undefined) return null;
  const isOverLimit = remaining < 0;

  return (
    <div
      id={characterCountId}
      data-slot="agent-composer-character-count"
      data-over-limit={isOverLimit ? '' : undefined}
      className={cn(
        'text-muted-foreground data-over-limit:text-destructive flex items-center gap-2 text-xs',
        className,
      )}
      {...props}
    >
      {isOverLimit && <span>Message is too long</span>}
      <span className="tabular-nums" aria-hidden>
        {remaining}
      </span>
      <span className="sr-only">{`${remaining} characters left`}</span>
    </div>
  );
}
