import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentChatTranscript, AgentChatTranscriptProps } from '@livekit/agents-ui';

export default {
  component: AgentChatTranscript,
  decorators: [AgentSessionProvider],
  render: (args: AgentChatTranscriptProps) => {
    return (
      <div className="w-96 h-dvh overflow-hidden mx-auto flex flex-col">
        <AgentChatTranscript {...args} />
      </div>
    );
  },
  args: {
    agentState: 'thinking',
    messages: [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        from: { isLocal: false },
        message: 'Hi, how are you?',
      },
      {
        id: '2',
        timestamp: new Date().toISOString(),
        from: { isLocal: true },
        message: "I'm good, thank you!",
      },
      {
        id: '3',
        timestamp: new Date().toISOString(),
        from: { isLocal: false },
        message: 'This is a longer message that should wrap to the next line.',
      },
      {
        id: '4',
        timestamp: new Date().toISOString(),
        from: { isLocal: true },
        message: "Great I'm responding with an even longer message to see how it wraps.",
      },
      ...Array.from({ length: 20 }).map((_, index) => ({
        id: `${5 + index}`,
        timestamp: new Date().toISOString(),
        from: { isLocal: index % 2 === 1 },
        message:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      })),
    ],
  },
  argTypes: {
    agentState: {
      control: 'radio',
      options: [
        'thinking',
        'speaking',
        'listening',
        'idle',
        'connecting',
        'disconnected',
        'failed',
      ],
    },
  },
  parameters: {
    layout: 'fullscreen',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentChatTranscriptProps> = {
  args: {},
};

export const InjectMessages: StoryObj<AgentChatTranscriptProps> = {
  args: {
    messages: [],
  },
  render: (args: AgentChatTranscriptProps) => {
    const [messages, setMessages] = React.useState<
      NonNullable<AgentChatTranscriptProps['messages']>
    >(args.messages ?? []);
    const nextIsLocalRef = React.useRef(false);

    const addMessage = () => {
      const isLocal = nextIsLocalRef.current;
      nextIsLocalRef.current = !isLocal;

      setMessages((prev) => [
        ...prev,
        {
          id: `${prev.length + 1}`,
          timestamp: new Date().toISOString(),
          from: { isLocal },
          message: isLocal
            ? 'This is a message from the user.'
            : 'This is a message from the agent.',
        },
      ]);
    };

    return (
      <div className="w-96 h-dvh overflow-hidden mx-auto flex flex-col">
        <div className="p-2 border-b">
          <button
            type="button"
            onClick={addMessage}
            className="px-3 py-1.5 text-sm rounded-md border bg-background hover:bg-accent"
          >
            Add message
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <AgentChatTranscript {...args} messages={messages} />
        </div>
      </div>
    );
  },
};
