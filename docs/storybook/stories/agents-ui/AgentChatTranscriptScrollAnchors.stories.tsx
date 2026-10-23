import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentChatTranscript, type AgentChatTranscriptProps } from '@livekit/agents-ui';

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

const meta = {
  title: 'agents-ui/AgentChatTranscript',
  component: AgentChatTranscript,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AgentChatTranscript>;

export default meta;

// Uses local messages only: no session provider, microphone, or credentials.
export const BooleanScrollAnchor: StoryObj<typeof meta> = {
  parameters: {
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
