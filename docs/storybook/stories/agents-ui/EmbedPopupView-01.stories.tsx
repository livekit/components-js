import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { TokenSource } from 'livekit-client';
import { AgentClient, AgentClientProps } from '@livekit/agents-ui';

const TOKEN_SOURCE = TokenSource.endpoint('/api/agents-ui/token');

export default {
  component: AgentClient,
  render: (args: AgentClientProps) => (
    <div className="h-screen w-full">
      <AgentClient {...args} tokenSource={TOKEN_SOURCE} />
    </div>
  ),
  args: {
    color: '#3b82f6',
    logo: '',
    agentName: 'Agent',
    supportsChatInput: true,
    supportsVideoInput: true,
    supportsScreenShare: true,
  },
  argTypes: {
    color: { control: { type: 'color' } },
    logo: { control: { type: 'text' } },
    agentName: { control: { type: 'text' } },
    supportsChatInput: { control: { type: 'boolean' } },
    supportsVideoInput: { control: { type: 'boolean' } },
    supportsScreenShare: { control: { type: 'boolean' } },
  },
  parameters: {
    layout: 'fullscreen',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentClientProps> = {
  args: {},
};
