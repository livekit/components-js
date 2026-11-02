import React, { type ReactNode, useState } from 'react';
import { PaperclipIcon } from 'lucide-react';
import { StoryObj } from '@storybook/react-vite';
import { type ReceivedChatMessage } from '@livekit/components-react';
import { Participant, Room } from 'livekit-client';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import {
  AgentChatTranscript,
  AgentComposer,
  AgentComposerActions,
  AgentComposerCharacterCount,
  AgentComposerField,
  AgentComposerInput,
  AgentComposerSubmit,
  AgentComposerProps,
  AgentTrackToggle,
} from '@livekit/agents-ui';

interface Args extends AgentComposerProps {
  placeholder: string;
  sendDelay: number;
  failSend: boolean;
}

const LOCAL_PARTICIPANT = new Room().localParticipant;
const AGENT_PARTICIPANT = new Participant('mock-agent-sid', 'agent', 'Agent');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mirrors what `useChat` does with a real session: a sent message shows up right away as
 * `sending`, then becomes `sent` or `failed`.
 */
function useMockChat({ sendDelay, failSend }: Pick<Args, 'sendDelay' | 'failSend'>) {
  const [messages, setMessages] = useState<ReceivedChatMessage[]>([
    {
      id: 'greeting',
      timestamp: Date.now(),
      message: 'Hi! How can I help?',
      from: AGENT_PARTICIPANT,
    },
  ]);

  const setStatus = (id: string, status: ReceivedChatMessage['status']) =>
    setMessages((previous) =>
      previous.map((message) => (message.id === id ? { ...message, status } : message)),
    );

  const deliver = async (id: string) => {
    setStatus(id, 'sending');
    await wait(sendDelay);
    setStatus(id, failSend ? 'failed' : 'sent');
  };

  const send = async (message: string) => {
    const id = crypto.randomUUID();
    setMessages((previous) => [
      ...previous,
      { id, timestamp: Date.now(), message, from: LOCAL_PARTICIPANT, status: 'sending' },
    ]);
    await deliver(id);
  };

  return { messages, send, resend: deliver };
}

const FIELD_CLASS_NAME = 'rounded-lg border border-input p-2 pl-3';

interface MockChatProps extends Args {
  /** Controls to the left of the field, outside it. */
  leading?: ReactNode;
  /** Controls inside the field, between the input and the send button. */
  actions?: ReactNode;
}

function MockChat({
  placeholder,
  sendDelay,
  failSend,
  leading,
  actions,
  className,
  ...props
}: MockChatProps) {
  const { messages, send, resend } = useMockChat({ sendDelay, failSend });

  return (
    <div className="flex h-[480px] w-96 flex-col gap-2">
      <AgentChatTranscript messages={messages} onResend={resend} className="flex-1" />
      <AgentComposer
        {...props}
        onSend={send}
        // A grid keeps leading controls beside the field, with the count under the field only
        className={[leading && 'grid grid-cols-[auto_minmax(0,1fr)] gap-x-2', className]
          .filter(Boolean)
          .join(' ')}
      >
        {leading}
        <AgentComposerField className={FIELD_CLASS_NAME}>
          <AgentComposerInput placeholder={placeholder} />
          {actions}
          <AgentComposerSubmit />
        </AgentComposerField>
        <AgentComposerCharacterCount className={leading ? 'col-start-2' : undefined} />
      </AgentComposer>
    </div>
  );
}

function MicrophoneToggle() {
  const [enabled, setEnabled] = useState(true);
  return (
    <AgentTrackToggle
      source="microphone"
      pressed={enabled}
      onPressedChange={setEnabled}
      aria-label={enabled ? 'Mute microphone' : 'Unmute microphone'}
    />
  );
}

export default {
  component: AgentComposer,
  subcomponents: { AgentComposerInput, AgentComposerActions, AgentComposerSubmit },
  render: (args: Args) => <MockChat {...args} />,
  args: {
    placeholder: 'Type something...',
    sendDelay: 800,
    failSend: false,
    disabled: false,
  },
  argTypes: {
    placeholder: { control: 'text' },
    sendDelay: { control: { type: 'number', min: 0, step: 200 } },
    failSend: { control: 'boolean' },
    disabled: { control: 'boolean' },
    maxLength: { control: 'number' },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<Args> = {};

/**
 * Every send fails. "Try again" shows the message sending, then failing again. Turn off `failSend`
 * in Controls to watch a retry succeed.
 */
export const SendFails: StoryObj<Args> = {
  args: {
    failSend: true,
  },
};

/** Typing past the limit is allowed. The count goes negative and sending is off until you trim it. */
export const MaxLength: StoryObj<Args> = {
  args: {
    maxLength: 20,
  },
};

export const Disabled: StoryObj<Args> = {
  args: {
    disabled: true,
  },
};

/** An attach button outside the field, and a microphone toggle inside it beside the send button. */
export const WithActions: StoryObj<Args> = {
  render: (args: Args) => (
    <MockChat
      {...args}
      leading={
        // Lines up with the send button, which sits inside the field's border and padding
        <AgentComposerActions className="mb-[9px] self-end">
          <button
            type="button"
            aria-label="Attach file"
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-9 cursor-pointer items-center justify-center rounded-md"
          >
            <PaperclipIcon className="size-4" />
          </button>
        </AgentComposerActions>
      }
      actions={
        <AgentComposerActions>
          <MicrophoneToggle />
        </AgentComposerActions>
      }
    />
  ),
};

/** Without `onSend`, messages go to the session's chat. The composer stays disabled until the session connects. */
export const SessionChat: StoryObj<AgentComposerProps> = {
  decorators: [AgentSessionProvider],
  render: () => (
    <AgentComposer className="w-96 data-[disabled]:opacity-60">
      <AgentComposerField className={FIELD_CLASS_NAME}>
        <AgentComposerInput />
        <AgentComposerSubmit />
      </AgentComposerField>
    </AgentComposer>
  ),
};
