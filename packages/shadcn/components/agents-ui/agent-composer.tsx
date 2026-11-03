'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import {
  useChat,
  useConnectionState,
  useLocalParticipant,
  useLocalParticipantPermissions,
  useTrackToggle,
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import { ArrowUpIcon, LoaderIcon, MicIcon, MicOffIcon, SquareIcon } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import {
  useAgentComposer,
  type UseAgentComposerProps,
  type UseAgentComposerReturn,
} from '@/hooks/agents-ui/use-agent-composer';

/**
 * Text the composer shows and announces. Pass any of these to `AgentComposer`'s `labels` to
 * translate or reword them.
 */
export interface AgentComposerLabels {
  /** The input's accessible name. */
  message: string;
  /** The input's placeholder while the microphone is on. */
  listening: string;
  /** The input's placeholder while the session connects. */
  connecting: string;
  /** The send button's accessible name. */
  send: string;
  /** The stop button's accessible name. */
  stop: string;
  /** The microphone button's accessible name. */
  listen: string;
  /** Shown when the browser or the user blocked microphone access. */
  microphoneBlocked: string;
  /** Shown when the microphone couldn't start for another reason, such as having none. */
  microphoneUnavailable: string;
  /** Read by screen readers for the character count. */
  characterCount: (length: number, maxLength: number) => string;
  /** Read by screen readers for the character count past `maxLength`. */
  overLimit: (over: number, maxLength: number) => string;
}

export const defaultAgentComposerLabels: AgentComposerLabels = {
  message: 'Message',
  listening: 'Listening…',
  connecting: 'Connecting…',
  send: 'Send message',
  stop: 'Stop',
  listen: 'Listen',
  microphoneBlocked: 'Microphone blocked',
  microphoneUnavailable: 'Microphone unavailable',
  characterCount: (length, maxLength) => `${length} of ${maxLength} characters`,
  overLimit: (over, maxLength) => `${over} characters over the ${maxLength} limit`,
};

/**
 * The microphone's `TrackSource` in the LiveKit protocol, as permissions list it. Spelled out to
 * avoid importing the protocol package, which is large.
 */
const MICROPHONE_SOURCE = 2;

/** Fills in defaults for any label that's missing or `undefined`, such as an untranslated one. */
function withDefaultLabels(labels: Partial<AgentComposerLabels> = {}): AgentComposerLabels {
  return {
    message: labels.message ?? defaultAgentComposerLabels.message,
    listening: labels.listening ?? defaultAgentComposerLabels.listening,
    connecting: labels.connecting ?? defaultAgentComposerLabels.connecting,
    send: labels.send ?? defaultAgentComposerLabels.send,
    stop: labels.stop ?? defaultAgentComposerLabels.stop,
    listen: labels.listen ?? defaultAgentComposerLabels.listen,
    microphoneBlocked: labels.microphoneBlocked ?? defaultAgentComposerLabels.microphoneBlocked,
    microphoneUnavailable:
      labels.microphoneUnavailable ?? defaultAgentComposerLabels.microphoneUnavailable,
    characterCount: labels.characterCount ?? defaultAgentComposerLabels.characterCount,
    overLimit: labels.overLimit ?? defaultAgentComposerLabels.overLimit,
  };
}

interface AgentComposerContextValue extends UseAgentComposerReturn {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  characterCountId: string;
  labels: AgentComposerLabels;
  connecting: boolean;
  listening?: boolean;
  onListeningChange?: (listening: boolean) => void;
  microphoneTrack?: MicrophoneTrack;
  microphonePending?: boolean;
  microphoneError?: unknown;
  responding?: boolean;
  onStop?: () => void;
}

type MicrophoneTrack = ComponentProps<typeof AgentAudioVisualizerBar>['audioTrack'];

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
  /**
   * The microphone's audio, so `AgentComposerMicrophone` can show its level while listening.
   * Without `onSend`, it's the session's microphone.
   */
  microphoneTrack?: MicrophoneTrack;
  /** Whether the microphone is starting or stopping. Without `onSend`, it's set for you. */
  microphonePending?: boolean;
  /**
   * Why the microphone couldn't start, such as a `NotAllowedError` when access is blocked. Without
   * `onSend`, it's set for you.
   */
  microphoneError?: unknown;
  /** Called when the session's microphone can't start. Only used without `onSend`. */
  onMicrophoneError?: (error: unknown) => void;
  /**
   * Whether the agent is replying. With `onStop`, the send button becomes a stop button while the
   * input is empty.
   */
  responding?: boolean;
  /** Stops the agent's reply, such as by interrupting it. */
  onStop?: () => void;
  /** Placeholder text for the default layout's input. */
  placeholder?: string;
  /** Text the composer shows and announces. */
  labels?: Partial<AgentComposerLabels>;
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
  draftKey,
  listening,
  onListeningChange,
  microphoneTrack,
  microphonePending,
  microphoneError,
  responding,
  onStop,
  placeholder,
  labels: labelsProp,
  connecting = false,
  asChild = false,
  className,
  children,
  onSubmit,
  ...props
}: Omit<AgentComposerProps, 'onMicrophoneError'> &
  Pick<UseAgentComposerProps, 'onSend'> & { connecting?: boolean }) {
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
    draftKey,
  });
  const labels = withDefaultLabels(labelsProp);
  const Comp = asChild ? Slot.Root : 'form';
  const isOverLimit = composer.remaining !== undefined && composer.remaining < 0;

  const handleSubmit = (event: FormSubmitEvent) => {
    onSubmit?.(event);
    // `onSubmit` can cancel the send with `preventDefault`, as Enter's `onKeyDown` can
    const canceled = event.defaultPrevented;
    event.preventDefault();
    if (canceled) return;
    // Keep focus in the input when the send button is clicked
    inputRef.current?.focus();
    composer.submit();
  };

  return (
    <AgentComposerContext.Provider
      value={{
        ...composer,
        inputRef,
        characterCountId,
        labels,
        connecting,
        listening,
        onListeningChange,
        microphoneTrack,
        microphonePending,
        microphoneError,
        responding,
        onStop,
      }}
    >
      <Comp
        data-slot="agent-composer"
        data-disabled={composer.disabled ? '' : undefined}
        data-over-limit={isOverLimit ? '' : undefined}
        data-listening={listening ? '' : undefined}
        data-responding={responding ? '' : undefined}
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
  onMicrophoneError,
  ...props
}: AgentComposerProps) {
  const { send } = useChat();
  const connectionState = useConnectionState();
  const [microphoneError, setMicrophoneError] = useState<unknown>();
  // `useTrackToggle` keeps the first `onDeviceError` it's given, so read the latest prop from a ref
  const onMicrophoneErrorRef = useRef(onMicrophoneError);
  useEffect(() => {
    onMicrophoneErrorRef.current = onMicrophoneError;
  });
  const handleMicrophoneError = useCallback((error: unknown) => {
    setMicrophoneError(error);
    onMicrophoneErrorRef.current?.(error);
  }, []);
  const microphone = useTrackToggle({
    source: Track.Source.Microphone,
    onDeviceError: handleMicrophoneError,
  });
  const { localParticipant, microphoneTrack } = useLocalParticipant();
  const permissions = useLocalParticipantPermissions();
  // Until the server sends permissions, assume the microphone is allowed, so it doesn't pop in later
  const canPublishMicrophone =
    !permissions ||
    (permissions.canPublish &&
      (permissions.canPublishSources.length === 0 ||
        permissions.canPublishSources.includes(MICROPHONE_SOURCE)));

  const handleSend = async (message: string) => {
    await send(message);
  };

  return (
    <AgentComposerRoot
      {...props}
      onSend={handleSend}
      disabled={disabled || connectionState !== ConnectionState.Connected}
      connecting={
        connectionState === ConnectionState.Connecting ||
        connectionState === ConnectionState.Reconnecting ||
        connectionState === ConnectionState.SignalReconnecting
      }
      listening={listening ?? microphone.enabled}
      // Leaving this out hides the microphone button when the token can't publish audio
      onListeningChange={
        canPublishMicrophone
          ? (next) => {
              onListeningChange?.(next);
              setMicrophoneError(undefined);
              Promise.resolve(microphone.toggle(next)).catch(handleMicrophoneError);
            }
          : undefined
      }
      microphoneTrack={
        props.microphoneTrack ??
        (microphoneTrack && {
          participant: localParticipant,
          publication: microphoneTrack,
          source: Track.Source.Microphone,
        })
      }
      microphonePending={props.microphonePending ?? microphone.pending}
      microphoneError={props.microphoneError ?? microphoneError}
    />
  );
}

/**
 * A text input for sending messages to an agent, with microphone and send buttons. Enter sends and
 * Shift+Enter adds a new line; on touch screens, Return adds a new line and the button sends. With
 * `maxLength`, the buttons and a character count move to a row below the input. Pass parts as
 * children to change the layout: `AgentComposerField` holds `AgentComposerInput`,
 * `AgentComposerActions`, `AgentComposerCharacterCount`, `AgentComposerMicrophone`, and
 * `AgentComposerSubmit`.
 *
 * Use `data-disabled` to style the disabled state, `data-over-limit` for a message longer than
 * `maxLength`, `data-listening` while the microphone is on, and `data-responding` while the agent
 * replies.
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
export function AgentComposer({ onMicrophoneError, ...props }: AgentComposerProps) {
  // Switching between the two remounts the composer, so pick one for its lifetime
  if (props.onSend) {
    return <AgentComposerRoot {...props} onSend={props.onSend} />;
  }
  return <SessionChatComposer {...props} onMicrophoneError={onMicrophoneError} />;
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
export interface AgentComposerInputProps extends Omit<
  ComponentProps<'textarea'>,
  'value' | 'defaultValue' | 'maxLength'
> {
  /**
   * Whether Enter sends. When unset, Enter sends unless the device has a touch screen and no
   * mouse, where Return adds a new line like other messaging apps.
   */
  sendOnEnter?: boolean;
}

function prefersNewLineOnEnter() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
}

/**
 * The composer's text field. It grows with its content and takes all textarea props. Its
 * placeholder changes while the session connects and while the microphone is on.
 *
 * @extends ComponentProps<'textarea'>
 */
export function AgentComposerInput({
  ref,
  disabled,
  className,
  onChange,
  onKeyDown,
  placeholder,
  sendOnEnter,
  'aria-label': ariaLabel,
  ...props
}: AgentComposerInputProps) {
  const {
    value,
    setValue,
    submit,
    remaining,
    inputRef,
    characterCountId,
    labels,
    connecting,
    listening,
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
    if (event.key !== 'Enter' || event.shiftKey || isComposing) return;
    if (!(sendOnEnter ?? !prefersNewLineOnEnter())) return;
    event.preventDefault();
    // Go through the form so Enter and the send button share one path, including `onSubmit`
    const form = event.currentTarget.form;
    // Safari before 16 has no `requestSubmit`
    if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
    else submit();
  };

  return (
    <textarea
      ref={setRefs}
      data-slot="agent-composer-input"
      rows={1}
      value={value}
      placeholder={connecting ? labels.connecting : listening ? labels.listening : placeholder}
      aria-label={ariaLabel ?? labels.message}
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
 * while listening, with the microphone's level before the icon when the composer has a
 * `microphoneTrack`. It shows a spinner while the microphone starts, and a crossed-out icon when it
 * can't, which you can click to try again. Renders nothing when the composer has no
 * `onListeningChange`, which is set for you without `onSend`.
 *
 * @extends ComponentProps<typeof Toggle>
 */
export function AgentComposerMicrophone({
  disabled,
  className,
  children,
  'aria-label': ariaLabel,
  ...props
}: AgentComposerMicrophoneProps) {
  const {
    listening = false,
    onListeningChange,
    microphoneTrack,
    microphonePending,
    microphoneError,
    labels,
    disabled: composerDisabled,
  } = useAgentComposerContext('AgentComposerMicrophone');
  if (!onListeningChange) return null;

  const errorLabel =
    microphoneError === undefined
      ? undefined
      : // Browsers reject with a DOMException, which isn't always an `Error` subclass
        typeof microphoneError === 'object' &&
          microphoneError !== null &&
          'name' in microphoneError &&
          microphoneError.name === 'NotAllowedError'
        ? labels.microphoneBlocked
        : labels.microphoneUnavailable;

  return (
    <Toggle
      data-slot="agent-composer-microphone"
      data-error={errorLabel ? '' : undefined}
      pressed={listening && !errorLabel}
      onPressedChange={onListeningChange}
      disabled={disabled || composerDisabled || microphonePending}
      aria-busy={microphonePending || undefined}
      aria-label={ariaLabel ?? errorLabel ?? labels.listen}
      title={errorLabel}
      className={cn(
        'text-muted-foreground hover:bg-accent hover:text-foreground h-9 min-w-9 cursor-pointer self-end',
        'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        'data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground',
        'data-error:text-destructive data-error:hover:text-destructive',
        className,
      )}
      {...props}
    >
      {children ??
        (microphonePending ? (
          <LoaderIcon className="animate-spin" />
        ) : errorLabel ? (
          <MicOffIcon />
        ) : (
          <>
            {listening && microphoneTrack && (
              <AgentAudioVisualizerBar
                size="icon"
                barCount={3}
                state="speaking"
                audioTrack={microphoneTrack}
                aria-hidden
                className="flex h-4 w-auto items-center gap-0.5"
              >
                <span className="h-full min-h-0.5 w-0.5 origin-center rounded-full bg-current" />
              </AgentAudioVisualizerBar>
            )}
            <MicIcon />
          </>
        ))}
    </Toggle>
  );
}

/**
 * Props for the AgentComposerSubmit component.
 */
export type AgentComposerSubmitProps = ComponentProps<typeof Button>;

/**
 * The composer's send button. Pass children to replace the icon. While the agent is `responding`
 * and the input is empty, it becomes a stop button that calls `onStop`.
 *
 * @extends ComponentProps<typeof Button>
 */
export function AgentComposerSubmit({
  disabled,
  variant,
  size = 'icon',
  className,
  children,
  'aria-label': ariaLabel,
  ...props
}: AgentComposerSubmitProps) {
  const {
    canSubmit,
    value,
    responding,
    onStop,
    labels,
    disabled: composerDisabled,
  } = useAgentComposerContext('AgentComposerSubmit');

  // `children` and `aria-label` describe sending, so Stop keeps its own icon and label
  if (responding && onStop && value.trim().length === 0) {
    return (
      <Button
        type="button"
        data-slot="agent-composer-stop"
        size={size}
        disabled={disabled || composerDisabled}
        variant={variant ?? 'default'}
        aria-label={labels.stop}
        onClick={onStop}
        className={cn('self-end', className)}
        {...props}
      >
        <SquareIcon className="size-3 fill-current" />
      </Button>
    );
  }

  const isDisabled = disabled || !canSubmit;

  return (
    <Button
      type="submit"
      data-slot="agent-composer-submit"
      size={size}
      disabled={isDisabled}
      variant={variant ?? (isDisabled ? 'secondary' : 'default')}
      aria-label={ariaLabel ?? labels.send}
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
 * Shows the message's length against `maxLength`, like "12/200", usually beside the buttons. It
 * turns red past the limit. Renders nothing without `maxLength`.
 *
 * @extends ComponentProps<'div'>
 */
export function AgentComposerCharacterCount({
  className,
  ...props
}: AgentComposerCharacterCountProps) {
  const { remaining, maxLength, characterCountId, labels } = useAgentComposerContext(
    'AgentComposerCharacterCount',
  );
  if (remaining === undefined || maxLength === undefined) return null;
  const isOverLimit = remaining < 0;
  const length = maxLength - remaining;

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
      <span className="tabular-nums" aria-hidden>
        {length}/{maxLength}
      </span>
      <span className="sr-only">
        {isOverLimit
          ? labels.overLimit(-remaining, maxLength)
          : labels.characterCount(length, maxLength)}
      </span>
    </div>
  );
}
