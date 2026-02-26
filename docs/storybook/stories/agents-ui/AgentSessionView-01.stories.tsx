import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentSessionView_01, AgentSessionView_01Props } from '@agents-ui';

export default {
  component: AgentSessionView_01,
  decorators: [AgentSessionProvider],
  render: (args: AgentSessionView_01Props) => <AgentSessionView_01 {...args} />,
  args: {
    className: 'h-screen w-screen',
  },
  argTypes: {},
  parameters: {
    layout: 'centered',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentSessionView_01Props> = {
  args: {},
};
