import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { ShoppingBagIcon } from 'lucide-react';
import { AgentStatusChange, AgentStatusLine, AgentStatusLineProps } from '@livekit/agents-ui';

export default {
  component: AgentStatusLine,
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    mark: {
      options: ['check', 'cross', 'alert', 'arrow', 'dash'],
      control: { type: 'radio' },
    },
  },
  parameters: {
    layout: 'centered',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentStatusLineProps> = {
  args: {
    mark: 'check',
    status: 'Verified',
    children: 'Priya Shah · BlueShield HMO',
    meta: 'Just now',
  },
};

export const Rescheduled: StoryObj<AgentStatusLineProps> = {
  args: {
    mark: 'arrow',
    active: true,
    status: 'Rescheduled',
    meta: 'Dr. Patel · Downtown',
  },
  render: (args) => (
    <AgentStatusLine {...args}>
      Tue, Apr 22 · <AgentStatusChange from="2:00 PM" to="3:30 PM" />
    </AgentStatusLine>
  ),
};

export const Alert: StoryObj<AgentStatusLineProps> = {
  args: {
    mark: 'alert',
    status: 'Allergen found',
    children: 'The pesto contains pine nuts',
  },
};

export const WithoutStatus: StoryObj<AgentStatusLineProps> = {
  args: {
    mark: 'cross',
    children: 'Dr. Patel is out of network',
    meta: 'Checked BlueShield HMO',
  },
};

export const CustomIcon: StoryObj<AgentStatusLineProps> = {
  args: {
    mark: 'arrow',
    active: true,
    icon: <ShoppingBagIcon aria-hidden="true" />,
    status: 'Ready for pickup',
    children: 'Order #4821',
  },
};
