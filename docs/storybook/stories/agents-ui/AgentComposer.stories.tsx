import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
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
  AgentComposerMicrophone,
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

// Styles the default layout's field from outside, since the stories don't pass their own parts
const COMPOSER_CLASS_NAME =
  '*:data-[slot=agent-composer-field]:rounded-lg *:data-[slot=agent-composer-field]:border *:data-[slot=agent-composer-field]:border-input *:data-[slot=agent-composer-field]:p-2 *:data-[slot=agent-composer-field]:pl-3';

function MockChat({ sendDelay, failSend, children, ...props }: Args) {
  const { messages, send, resend } = useMockChat({ sendDelay, failSend });
  const [listening, setListening] = useState(false);

  return (
    <div className="flex h-[480px] w-96 flex-col gap-2">
      <AgentChatTranscript messages={messages} onResend={resend} className="flex-1" />
      <AgentComposer
        {...props}
        onSend={send}
        listening={listening}
        onListeningChange={setListening}
        className={COMPOSER_CLASS_NAME}
      >
        {children}
      </AgentComposer>
    </div>
  );
}

export default {
  component: AgentComposer,
  subcomponents: {
    AgentComposerField,
    AgentComposerInput,
    AgentComposerActions,
    AgentComposerMicrophone,
    AgentComposerSubmit,
    AgentComposerCharacterCount,
  },
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

/** Custom parts: an attach button on the left of the lower row, with the count, microphone, and send on the right. */
export const WithActions: StoryObj<Args> = {
  args: {
    maxLength: 200,
  },
  render: (args: Args) => (
    <MockChat {...args}>
      <AgentComposerField className="flex-col items-stretch gap-1 !pl-2">
        <AgentComposerInput placeholder={args.placeholder} className="px-1" />
        <div className="flex items-center justify-between gap-2">
          <AgentComposerActions>
            <button
              type="button"
              aria-label="Attach file"
              className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-9 cursor-pointer items-center justify-center rounded-md"
            >
              <PlusIcon className="size-4" />
            </button>
          </AgentComposerActions>
          <AgentComposerActions className="gap-2">
            <AgentComposerCharacterCount />
            <AgentComposerMicrophone />
            <AgentComposerSubmit />
          </AgentComposerActions>
        </div>
      </AgentComposerField>
    </MockChat>
  ),
};

/** Without `onSend`, messages go to the session's chat. The composer stays disabled until the session connects. */
export const SessionChat: StoryObj<AgentComposerProps> = {
  decorators: [AgentSessionProvider],
  render: () => (
    <AgentComposer className={`w-96 data-[disabled]:opacity-60 ${COMPOSER_CLASS_NAME}`} />
  ),
};
