import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionState } from 'livekit-client';
import {
  AgentComposer,
  AgentComposerActions,
  AgentComposerInput,
  AgentComposerSubmit,
} from '@/components/agents-ui/agent-composer';

const sendMock = vi.fn();
let connectionState = ConnectionState.Connected;

vi.mock('@livekit/components-react', () => ({
  useChat: () => ({ send: sendMock }),
  useConnectionState: () => connectionState,
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
const getForm = () => getInput().closest('form')!;

describe('AgentComposer', () => {
  beforeEach(() => {
    sendMock.mockReset();
    connectionState = ConnectionState.Connected;
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

  it('allows typing while sending but not a second send', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    const onSend = vi.fn(() => pending.promise);
    render(<AgentComposer onSend={onSend} />);

    await user.type(getInput(), 'First{Enter}');
    expect(getForm()).toHaveAttribute('data-status', 'sending');

    await user.type(getInput(), 'Second{Enter}');
    expect(getInput()).toHaveValue('Second');
    expect(onSend).toHaveBeenCalledTimes(1);

    await act(async () => pending.resolve());
    expect(getForm()).toHaveAttribute('data-status', 'idle');

    await user.type(getInput(), '{Enter}');
    expect(onSend).toHaveBeenLastCalledWith('Second');
  });

  it('restores the message and reports the error when sending fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Network error');
    const onError = vi.fn();
    render(<AgentComposer onSend={() => Promise.reject(error)} onError={onError} />);

    await user.type(getInput(), 'Hello{Enter}');

    await waitFor(() => expect(getForm()).toHaveAttribute('data-status', 'error'));
    expect(getInput()).toHaveValue('Hello');
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('keeps text typed while sending when the send fails', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    render(<AgentComposer onSend={() => pending.promise} />);

    await user.type(getInput(), 'First{Enter}');
    await user.type(getInput(), 'Second');
    await act(async () => pending.reject(new Error('Network error')));

    expect(getForm()).toHaveAttribute('data-status', 'error');
    expect(getInput()).toHaveValue('Second');
  });

  it('does not send messages longer than maxLength', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AgentComposer onSend={onSend} value="Too long" maxLength={3} />);

    await user.type(getInput(), '{Enter}');

    expect(onSend).not.toHaveBeenCalled();
    expect(getSubmit()).toBeDisabled();
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
        <AgentComposerInput placeholder="Ask anything" aria-label="Ask the agent" />
        <AgentComposerActions>
          <button type="button">Attach</button>
        </AgentComposerActions>
        <AgentComposerSubmit aria-label="Send">Go</AgentComposerSubmit>
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
    });
  });
});
