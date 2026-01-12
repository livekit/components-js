import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentChatIndicator, AgentChatIndicatorProps } from '@agents-ui';

export default {
  component: AgentChatIndicator,
  decorators: [AgentSessionProvider],
  render: (args: AgentChatIndicatorProps) => <AgentChatIndicator {...args} />,
  args: {
    agentState: 'thinking',
  },
  argTypes: {
    size: {
      options: ['sm', 'md', 'lg'],
      control: { type: 'radio' },
    },
  },
  parameters: {
    layout: 'centered',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentChatIndicatorProps> = {
  args: {},
};
