import React, { useState } from 'react';
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
  AgentComposerInput,
  AgentComposerSubmit,
  AgentComposerProps,
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

function MockChat({ placeholder, sendDelay, failSend, children, ...props }: Args) {
  const { messages, send, resend } = useMockChat({ sendDelay, failSend });

  return (
    <div className="flex h-[480px] w-96 flex-col gap-2">
      <AgentChatTranscript messages={messages} onResend={resend} className="flex-1" />
      <AgentComposer {...props} onSend={send} className="rounded-lg border border-input p-2 pl-3">
        {children ?? (
          <>
            <AgentComposerInput placeholder={placeholder} />
            <AgentComposerSubmit />
            <AgentComposerCharacterCount />
          </>
        )}
      </AgentComposer>
    </div>
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

export const WithActions: StoryObj<Args> = {
  render: (args: Args) => (
    <MockChat {...args}>
      <AgentComposerInput placeholder={args.placeholder} />
      <AgentComposerActions>
        <button
          type="button"
          aria-label="Attach file"
          className="text-muted-foreground hover:text-foreground rounded-md p-2"
        >
          <PaperclipIcon className="size-4" />
        </button>
      </AgentComposerActions>
      <AgentComposerSubmit className="rounded-full" />
      <AgentComposerCharacterCount />
    </MockChat>
  ),
};

/** Without `onSend`, messages go to the session's chat. The composer stays disabled until the session connects. */
export const SessionChat: StoryObj<AgentComposerProps> = {
  decorators: [AgentSessionProvider],
  render: () => (
    <AgentComposer className="w-96 rounded-lg border border-input p-2 pl-3 data-[disabled]:opacity-60" />
  ),
};
