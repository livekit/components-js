import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionState } from 'livekit-client';
import {
  AgentComposer,
  AgentComposerActions,
  AgentComposerField,
  AgentComposerInput,
  AgentComposerMicrophone,
  AgentComposerSubmit,
} from '@/components/agents-ui/agent-composer';

const sendMock = vi.fn();
const toggleMicrophoneMock = vi.fn();
let connectionState = ConnectionState.Connected;
let microphoneEnabled = false;
let microphonePending = false;
let permissions: { canPublish: boolean; canPublishSources: number[] } | undefined;
// `useTrackToggle` keeps the first `onDeviceError` it's given, so the mock does too
let firstOnDeviceError: ((error: unknown) => void) | undefined;

vi.mock('@livekit/components-react', () => ({
  useChat: () => ({ send: sendMock }),
  useConnectionState: () => connectionState,
  useTrackToggle: ({ onDeviceError }: { onDeviceError?: (error: unknown) => void }) => {
    firstOnDeviceError ??= onDeviceError;
    return {
      enabled: microphoneEnabled,
      pending: microphonePending,
      toggle: toggleMicrophoneMock,
    };
  },
  useLocalParticipant: () => ({ localParticipant: {}, microphoneTrack: undefined }),
  useLocalParticipantPermissions: () => permissions,
}));

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const getInput = () => screen.getByRole('textbox', { name: 'Message' });
const getSubmit = () => screen.getByRole('button', { name: 'Send message' });
const getMicrophone = () => screen.getByRole('button', { name: 'Listen' });
const getForm = () => getInput().closest('form')!;

describe('AgentComposer', () => {
  beforeEach(() => {
    sendMock.mockReset();
    toggleMicrophoneMock.mockReset();
    connectionState = ConnectionState.Connected;
    microphoneEnabled = false;
    microphonePending = false;
    permissions = undefined;
    firstOnDeviceError = undefined;
    window.sessionStorage.clear();
  });

  it('renders a labeled input and send button by default', () => {
    render(<AgentComposer onSend={vi.fn()} />);
    expect(getInput()).toBeInTheDocument();
    expect(getSubmit()).toBeDisabled();
  });

  it('sends the trimmed message on Enter and clears the input', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AgentComposer onSend={onSend} />);

    await user.type(getInput(), '  Hello  {Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello');
    expect(getInput()).toHaveValue('');
  });

  it('calls onSubmit when sending with Enter or the send button', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AgentComposer onSend={vi.fn()} onSubmit={onSubmit} />);

    await user.type(getInput(), 'First{Enter}');
    await user.type(getInput(), 'Second');
    await user.click(getSubmit());

    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('adds a new line on Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AgentComposer onSend={onSend} />);

    await user.type(getInput(), 'Line one{Shift>}{Enter}{/Shift}Line two');

    expect(onSend).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue('Line one\nLine two');
  });

  it('does not send on Enter while an input method editor is composing', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AgentComposer onSend={onSend} />);

    await user.type(getInput(), 'にほん');
    fireEvent.keyDown(getInput(), { key: 'Enter', isComposing: true });
    fireEvent.keyDown(getInput(), { key: 'Enter', keyCode: 229 });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('keeps focus in the input after clicking send', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AgentComposer onSend={onSend} />);

    await user.type(getInput(), 'Hello');
    await user.click(getSubmit());

    expect(onSend).toHaveBeenCalledWith('Hello');
    expect(getInput()).toHaveFocus();
  });

  it('sends the next message without waiting for the previous one', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    const onSend = vi.fn(() => pending.promise);
    render(<AgentComposer onSend={onSend} />);

    await user.type(getInput(), 'First{Enter}');
    expect(getInput()).toHaveValue('');
    await user.type(getInput(), 'Second{Enter}');

    expect(onSend).toHaveBeenCalledTimes(2);
    expect(onSend).toHaveBeenLastCalledWith('Second');
    expect(getInput()).not.toBeDisabled();
    await act(async () => pending.resolve());
  });

  it('puts the message back and reports the error when sending fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Network error');
    const onError = vi.fn();
    render(<AgentComposer onSend={() => Promise.reject(error)} onError={onError} />);

    await user.type(getInput(), 'Hello{Enter}');

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
    expect(getInput()).toHaveValue('Hello');
  });

  it('keeps anything typed since a message that fails', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    render(<AgentComposer onSend={() => pending.promise} />);

    await user.type(getInput(), 'First{Enter}');
    await user.type(getInput(), 'Second');
    await act(async () => pending.reject(new Error('Network error')));

    expect(getInput()).toHaveValue('Second');
  });

  it('puts a failed message back through onValueChange when controlled', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <AgentComposer
        value="Hello"
        onValueChange={onValueChange}
        onSend={() => Promise.reject(new Error('Network error'))}
      />,
    );

    await user.type(getInput(), '{Enter}');

    await waitFor(() => expect(onValueChange.mock.calls).toEqual([[''], ['Hello']]));
  });

  it('reports errors that onSend throws synchronously', async () => {
    const user = userEvent.setup();
    const error = new Error('Not connected');
    const onError = vi.fn();
    render(
      <AgentComposer
        onSend={() => {
          throw error;
        }}
        onError={onError}
      />,
    );

    await user.type(getInput(), 'Hello{Enter}');

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });

  it('does not send messages longer than maxLength', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AgentComposer onSend={onSend} value="Too long" maxLength={3} />);

    await user.type(getInput(), '{Enter}');

    expect(onSend).not.toHaveBeenCalled();
    expect(getSubmit()).toBeDisabled();
  });

  it('counts toward maxLength and past it without cutting off typing', async () => {
    const user = userEvent.setup();
    render(<AgentComposer onSend={vi.fn()} maxLength={5} />);

    expect(getInput()).toHaveAccessibleDescription('0 of 5 characters');
    expect(screen.getByText('0/5')).toBeInTheDocument();

    await user.type(getInput(), 'Hello');
    expect(getInput()).toHaveAccessibleDescription('5 of 5 characters');
    expect(getSubmit()).toBeEnabled();

    await user.type(getInput(), ' there');
    expect(getInput()).toHaveValue('Hello there');
    expect(screen.getByText('11/5')).toBeInTheDocument();
    expect(getInput()).toHaveAccessibleDescription('6 characters over the 5 limit');
    expect(getInput()).toBeInvalid();
    expect(getSubmit()).toBeDisabled();

    await user.type(getInput(), '{Backspace>6/}');
    expect(getInput()).toHaveAccessibleDescription('5 of 5 characters');
    expect(getInput()).toBeValid();
    expect(getSubmit()).toBeEnabled();
  });

  it('puts the character count inside the field with the buttons', () => {
    render(<AgentComposer onSend={vi.fn()} maxLength={5} />);

    const field = getInput().closest('[data-slot="agent-composer-field"]');
    expect(field).toContainElement(screen.getByText('0/5'));
    expect(field).toContainElement(getSubmit());
  });

  it('shows no character count without maxLength', () => {
    render(<AgentComposer onSend={vi.fn()} />);

    expect(screen.queryByText(/characters/)).not.toBeInTheDocument();
  });

  it('supports a controlled value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<AgentComposer onSend={vi.fn()} value="Draft" onValueChange={onValueChange} />);

    expect(getInput()).toHaveValue('Draft');
    await user.type(getInput(), '!');
    expect(onValueChange).toHaveBeenCalledWith('Draft!');
  });

  it('does not send when disabled', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AgentComposer onSend={onSend} defaultValue="Hello" disabled />);

    expect(getInput()).toBeDisabled();
    expect(getForm()).toHaveAttribute('data-disabled');
    fireEvent.keyDown(getInput(), { key: 'Enter' });
    await user.click(getSubmit());

    expect(onSend).not.toHaveBeenCalled();
  });

  it('renders custom parts and actions', () => {
    render(
      <AgentComposer onSend={vi.fn()}>
        <AgentComposerField>
          <AgentComposerInput placeholder="Ask anything" aria-label="Ask the agent" />
          <AgentComposerActions>
            <button type="button">Attach</button>
          </AgentComposerActions>
          <AgentComposerSubmit aria-label="Send">Go</AgentComposerSubmit>
        </AgentComposerField>
      </AgentComposer>,
    );

    expect(screen.getByRole('textbox', { name: 'Ask the agent' })).toHaveAttribute(
      'placeholder',
      'Ask anything',
    );
    expect(screen.getByRole('button', { name: 'Attach' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toHaveTextContent('Go');
  });

  describe('without onSend', () => {
    it("sends through the session's chat", async () => {
      const user = userEvent.setup();
      render(<AgentComposer />);

      await user.type(getInput(), 'Hello{Enter}');

      expect(sendMock).toHaveBeenCalledWith('Hello');
    });

    it('is disabled until the session connects', () => {
      connectionState = ConnectionState.Connecting;
      render(<AgentComposer />);

      expect(getInput()).toBeDisabled();
      expect(getSubmit()).toBeDisabled();
      expect(getMicrophone()).toBeDisabled();
    });

    it("turns the session's microphone on and off", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AgentComposer />);
      expect(getMicrophone()).toHaveAttribute('aria-pressed', 'false');

      await user.click(getMicrophone());
      expect(toggleMicrophoneMock).toHaveBeenLastCalledWith(true);

      microphoneEnabled = true;
      rerender(<AgentComposer />);
      expect(getMicrophone()).toHaveAttribute('aria-pressed', 'true');

      await user.click(getMicrophone());
      expect(toggleMicrophoneMock).toHaveBeenLastCalledWith(false);
    });
  });

  describe('microphone', () => {
    it('is hidden without onListeningChange when using onSend', () => {
      render(<AgentComposer onSend={vi.fn()} />);

      expect(screen.queryByRole('button', { name: 'Listen' })).not.toBeInTheDocument();
    });

    it('reports listening changes', async () => {
      const user = userEvent.setup();
      const onListeningChange = vi.fn();
      render(
        <AgentComposer onSend={vi.fn()} listening={false} onListeningChange={onListeningChange} />,
      );

      await user.click(getMicrophone());

      expect(onListeningChange).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('changes the placeholder while listening', () => {
      const { rerender, container } = render(
        <AgentComposer
          onSend={vi.fn()}
          placeholder="Type something..."
          listening={false}
          onListeningChange={vi.fn()}
        />,
      );
      expect(getInput()).toHaveAttribute('placeholder', 'Type something...');
      expect(container.firstElementChild).not.toHaveAttribute('data-listening');

      rerender(
        <AgentComposer
          onSend={vi.fn()}
          placeholder="Type something..."
          listening
          onListeningChange={vi.fn()}
        />,
      );
      expect(getInput()).toHaveAttribute('placeholder', 'Listening…');
      expect(getInput()).toBeEnabled();
      expect(container.firstElementChild).toHaveAttribute('data-listening');
    });

    it('can be placed in a custom layout', () => {
      render(
        <AgentComposer onSend={vi.fn()} listening onListeningChange={vi.fn()}>
          <AgentComposerField>
            <AgentComposerInput />
            <AgentComposerMicrophone aria-label="Talk" />
          </AgentComposerField>
        </AgentComposer>,
      );

      expect(screen.getByRole('button', { name: 'Talk' })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('microphone states', () => {
    const blocked = Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' });

    it('shows a spinner and waits while the microphone starts', () => {
      render(<AgentComposer onSend={vi.fn()} onListeningChange={vi.fn()} microphonePending />);

      expect(getMicrophone()).toBeDisabled();
      expect(getMicrophone()).toHaveAttribute('aria-busy', 'true');
    });

    it('says when the microphone is blocked, and tries again on click', async () => {
      const user = userEvent.setup();
      const onListeningChange = vi.fn();
      render(
        <AgentComposer
          onSend={vi.fn()}
          listening
          onListeningChange={onListeningChange}
          microphoneError={blocked}
        />,
      );

      const microphone = screen.getByRole('button', { name: 'Microphone blocked' });
      expect(microphone).toHaveAttribute('aria-pressed', 'false');

      await user.click(microphone);
      expect(onListeningChange).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('calls other failures unavailable', () => {
      render(
        <AgentComposer
          onSend={vi.fn()}
          onListeningChange={vi.fn()}
          microphoneError={new Error('No device')}
        />,
      );

      expect(screen.getByRole('button', { name: 'Microphone unavailable' })).toBeInTheDocument();
    });

    it("reports the session's microphone failing to start, then clears it on retry", async () => {
      const user = userEvent.setup();
      const onMicrophoneError = vi.fn();
      toggleMicrophoneMock.mockRejectedValueOnce(blocked);
      render(<AgentComposer onMicrophoneError={onMicrophoneError} />);

      await user.click(getMicrophone());
      const microphone = await screen.findByRole('button', { name: 'Microphone blocked' });
      expect(onMicrophoneError).toHaveBeenCalledExactlyOnceWith(blocked);

      await user.click(microphone);
      expect(getMicrophone()).toBeInTheDocument();
      expect(toggleMicrophoneMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Enter on touch screens', () => {
    const originalMatchMedia = window.matchMedia;
    const useCoarsePointer = () => {
      window.matchMedia = vi.fn((query: string) => ({
        matches: query === '(pointer: coarse)',
        media: query,
      })) as unknown as typeof window.matchMedia;
    };

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('adds a new line instead of sending', async () => {
      useCoarsePointer();
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(<AgentComposer onSend={onSend} />);

      await user.type(getInput(), 'One{Enter}Two');

      expect(onSend).not.toHaveBeenCalled();
      expect(getInput()).toHaveValue('One\nTwo');
    });

    it('sends when sendOnEnter is set', async () => {
      useCoarsePointer();
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(
        <AgentComposer onSend={onSend}>
          <AgentComposerInput sendOnEnter />
        </AgentComposer>,
      );

      await user.type(getInput(), 'Hello{Enter}');

      await waitFor(() => expect(onSend).toHaveBeenCalledWith('Hello'));
    });
  });

  it('uses custom labels', () => {
    render(
      <AgentComposer
        onSend={vi.fn()}
        listening
        onListeningChange={vi.fn()}
        maxLength={10}
        labels={{
          message: 'Mensaje',
          send: 'Enviar',
          listen: 'Escuchar',
          listening: 'Escuchando…',
          characterCount: (length, max) => `${length} de ${max}`,
        }}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Mensaje' });
    expect(input).toHaveAttribute('placeholder', 'Escuchando…');
    expect(input).toHaveAccessibleDescription('0 de 10');
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeInTheDocument();
  });

  it('says it is connecting while the session connects', () => {
    connectionState = ConnectionState.Connecting;
    render(<AgentComposer placeholder="Type something..." />);

    expect(getInput()).toHaveAttribute('placeholder', 'Connecting…');
  });

  describe('stopping a reply', () => {
    it('turns the send button into a stop button while the agent replies', async () => {
      const user = userEvent.setup();
      const onStop = vi.fn();
      render(<AgentComposer onSend={vi.fn()} responding onStop={onStop} />);

      await user.click(screen.getByRole('button', { name: 'Stop' }));
      expect(onStop).toHaveBeenCalledOnce();

      await user.type(getInput(), 'Wait');
      expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
      expect(getSubmit()).toBeEnabled();
    });

    it('keeps the send button without onStop', () => {
      render(<AgentComposer onSend={vi.fn()} responding />);

      expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
    });
  });

  describe('drafts', () => {
    it('keeps unsent text across remounts and clears it after sending', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<AgentComposer onSend={vi.fn()} draftKey="thread-1" />);
      await user.type(getInput(), 'Half a thought');
      unmount();

      render(<AgentComposer onSend={vi.fn()} draftKey="thread-1" />);
      expect(getInput()).toHaveValue('Half a thought');

      await user.type(getInput(), '{Enter}');
      expect(window.sessionStorage.getItem('thread-1')).toBeNull();
    });

    it('keeps drafts separate by key', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<AgentComposer onSend={vi.fn()} draftKey="thread-1" />);
      await user.type(getInput(), 'For thread one');
      unmount();

      render(<AgentComposer onSend={vi.fn()} draftKey="thread-2" />);
      expect(getInput()).toHaveValue('');
    });
  });

  it('counts an emoji as one character', async () => {
    const user = userEvent.setup();
    render(<AgentComposer onSend={vi.fn()} maxLength={10} />);

    await user.type(getInput(), 'Hi 👋🏽 é');

    expect(screen.getByText('6/10')).toBeInTheDocument();
  });

  it('lets onSubmit cancel the send', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AgentComposer onSend={onSend} onSubmit={(event) => event.preventDefault()} />);

    await user.type(getInput(), 'Hello{Enter}');
    await user.type(getInput(), '!');
    await user.click(getSubmit());

    expect(onSend).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue('Hello!');
  });

  it('sends on Enter without requestSubmit, as in Safari before 16', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const requestSubmit = HTMLFormElement.prototype.requestSubmit;
    // @ts-expect-error -- removed to stand in for an older browser
    delete HTMLFormElement.prototype.requestSubmit;
    try {
      render(<AgentComposer onSend={onSend} />);
      await user.type(getInput(), 'Hello{Enter}');
    } finally {
      HTMLFormElement.prototype.requestSubmit = requestSubmit;
    }

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('uses the default for a label passed as undefined', () => {
    render(
      <AgentComposer
        onSend={vi.fn()}
        maxLength={10}
        labels={{ send: undefined, characterCount: undefined }}
      />,
    );

    expect(getSubmit()).toBeInTheDocument();
    expect(screen.getByText('0 of 10 characters')).toBeInTheDocument();
  });

  it('disables the stop button while the composer is disabled', () => {
    render(<AgentComposer onSend={vi.fn()} responding onStop={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();
  });

  describe('microphone permission', () => {
    it("hides the microphone when the token can't publish audio", () => {
      permissions = { canPublish: true, canPublishSources: [1] };
      render(<AgentComposer />);

      expect(screen.queryByRole('button', { name: 'Listen' })).not.toBeInTheDocument();
    });

    it('shows the microphone when the token can publish audio', () => {
      permissions = { canPublish: true, canPublishSources: [2] };
      render(<AgentComposer />);

      expect(getMicrophone()).toBeInTheDocument();
    });
  });

  it('reports microphone errors to the latest onMicrophoneError', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = render(<AgentComposer onMicrophoneError={first} />);
    rerender(<AgentComposer onMicrophoneError={latest} />);

    act(() => firstOnDeviceError?.(new Error('No device')));

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledOnce();
  });

  it('loads the draft for a new draftKey', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem('thread-2', 'For thread two');
    const { rerender } = render(<AgentComposer onSend={vi.fn()} draftKey="thread-1" />);
    await user.type(getInput(), 'For thread one');

    rerender(<AgentComposer onSend={vi.fn()} draftKey="thread-2" />);
    expect(getInput()).toHaveValue('For thread two');

    rerender(<AgentComposer onSend={vi.fn()} draftKey="thread-3" />);
    expect(getInput()).toHaveValue('');
  });
});
