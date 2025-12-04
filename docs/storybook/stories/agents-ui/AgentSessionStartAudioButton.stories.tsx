import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentSessionStartAudioButton, type AgentSessionStartAudioButtonProps } from '@agents-ui';

export default {
  component: AgentSessionStartAudioButton,
  decorators: [AgentSessionProvider],
  render: (args: AgentSessionStartAudioButtonProps) => <AgentSessionStartAudioButton {...args} />,
  argTypes: {
    onClick: { action: 'onClick' },
    className: { control: { type: 'text' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentSessionStartAudioButtonProps> = {
  args: {},
};
