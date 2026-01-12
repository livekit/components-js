import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentDisconnectButton, type AgentDisconnectButtonProps } from '@agents-ui';

export default {
  component: AgentDisconnectButton,
  decorators: [AgentSessionProvider],
  render: (args: AgentDisconnectButtonProps) => (
    <AgentDisconnectButton {...args}></AgentDisconnectButton>
  ),
  argTypes: {
    size: {
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
      control: { type: 'radio' },
    },
    variant: {
      options: ['default', 'outline', 'destructive', 'ghost', 'link'],
      control: { type: 'radio' },
    },
    disabled: { control: { type: 'boolean' } },
    className: { control: { type: 'text' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentDisconnectButtonProps> = {
  args: {},
};

export const Icon: StoryObj<AgentDisconnectButtonProps> = {
  args: {
    size: 'icon',
  },
};
