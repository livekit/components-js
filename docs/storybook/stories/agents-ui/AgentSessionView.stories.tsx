import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentSessionView, AgentSessionViewProps } from '@agents-ui';

export default {
  component: AgentSessionView,
  decorators: [AgentSessionProvider],
  render: (args: AgentSessionViewProps) => <AgentSessionView {...args} />,
  args: {},
  argTypes: {},
  parameters: {
    layout: 'centered',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentSessionViewProps> = {
  args: {},
};
