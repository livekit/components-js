import React, { useState } from 'react';
import { PaperclipIcon } from 'lucide-react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import {
  AgentComposer,
  AgentComposerActions,
  AgentComposerInput,
  AgentComposerSubmit,
  AgentComposerProps,
} from '@livekit/agents-ui';

interface Args extends AgentComposerProps {
  placeholder: string;
  sendDelay: number;
  failSend: boolean;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Sends with a delay so the sending state is visible, and lists what was sent. */
function MockComposer({ placeholder, sendDelay, failSend, children, ...props }: Args) {
  const [sent, setSent] = useState<string[]>([]);

  const handleSend = async (message: string) => {
    await wait(sendDelay);
    if (failSend) throw new Error('Mock send failed');
    setSent((previous) => [...previous, message]);
  };

  return (
    <div className="flex w-96 flex-col gap-4">
      <AgentComposer
        {...props}
        onSend={handleSend}
        className="rounded-lg border border-input p-2 pl-3 data-[status=error]:border-destructive"
      >
        {children ?? (
          <>
            <AgentComposerInput placeholder={placeholder} />
            <AgentComposerSubmit />
          </>
        )}
      </AgentComposer>
      <ol aria-label="Sent messages" className="text-muted-foreground list-decimal pl-5 text-sm">
        {sent.map((message, index) => (
          <li key={index} className="whitespace-pre-wrap">
            {message}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default {
  component: AgentComposer,
  subcomponents: { AgentComposerInput, AgentComposerActions, AgentComposerSubmit },
  render: (args: Args) => <MockComposer {...args} />,
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

export const SendFails: StoryObj<Args> = {
  args: {
    failSend: true,
  },
};

export const SlowSend: StoryObj<Args> = {
  args: {
    sendDelay: 3000,
  },
};

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
    <MockComposer {...args}>
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
    </MockComposer>
  ),
};

/** Without `onSend`, messages go to the session's chat. The composer stays disabled until the session connects. */
export const SessionChat: StoryObj<AgentComposerProps> = {
  decorators: [AgentSessionProvider],
  render: () => (
    <AgentComposer className="w-96 rounded-lg border border-input p-2 pl-3 data-[disabled]:opacity-60" />
  ),
};
