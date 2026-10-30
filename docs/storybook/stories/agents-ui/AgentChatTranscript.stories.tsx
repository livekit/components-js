import React from 'react';
import { SendHorizontal } from 'lucide-react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentChatTranscript, AgentChatTranscriptProps } from '@livekit/agents-ui';

export default {
  component: AgentChatTranscript,
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
  decorators: [AgentSessionProvider],
  args: {},
};

export const InjectMessages: StoryObj<AgentChatTranscriptProps> = {
  decorators: [AgentSessionProvider],
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
      <div className="w-96 h-dvh overflow-hidden mx-auto flex flex-col border">
        <div className="flex-1 overflow-hidden">
          <AgentChatTranscript
            {...args}
            messages={messages}
            className="**:data-[slot=message-scroller-content]:p-4"
          />
        </div>
        <div className="p-2 border-t flex justify-end end bg-accent">
          <button
            type="button"
            onClick={addMessage}
            className="grid size-8 place-content-center text-sm rounded-md border bg-background hover:bg-accent"
          >
            <div className="sr-only">Add message</div>
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  },
};

type Messages = NonNullable<AgentChatTranscriptProps['messages']>;

const initialMessages: Messages = Array.from({ length: 6 }, (_, index) => ({
  id: `message-${index}`,
  timestamp: index * 1000,
  from: { isLocal: index % 2 === 0 } as Messages[number]['from'],
  message:
    index === 5
      ? 'Latest reply: this message should be an anchor in both examples.'
      : `Message ${index + 1}: Earlier conversation content makes this transcript scrollable. Both examples receive the same messages in the same order.`,
}));

// Uses local messages only: no session provider, microphone, or credentials.
export const BooleanScrollAnchor: StoryObj<AgentChatTranscriptProps> = {
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Boolean true and "any" anchor every message. With the default last-anchor position, both transcripts start at the latest message and follow new messages in the same way. False or omitting scrollAnchor leaves messages unanchored; "user" and "other" select by sender.',
      },
    },
  },
  render: () => {
    const [messages, setMessages] = React.useState(initialMessages);
    const appendMessage = () => {
      setMessages((previous) => [
        ...previous,
        {
          id: `message-${previous.length}`,
          timestamp: previous.length * 1000,
          from: { isLocal: previous.length % 2 === 0 } as Messages[number]['from'],
          message: `New message ${previous.length + 1}: both transcripts should anchor here.`,
        },
      ]);
    };

    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md border px-3 py-2" onClick={appendMessage}>
            Add message to both
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-2"
            onClick={() => setMessages(initialMessages)}
          >
            Reset messages
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([true, 'any'] as const).map((mode) => (
            <section key={String(mode)} className="min-w-0 rounded-lg border">
              <h2 className="border-b p-3 font-mono text-sm">
                {mode === true ? 'scrollAnchor={true}' : 'scrollAnchor="any"'}
              </h2>
              <div className="h-80 overflow-hidden">
                <AgentChatTranscript
                  messages={messages}
                  scrollAnchor={mode}
                  className="**:data-[slot=message-scroller-content]:p-4"
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  },
};
