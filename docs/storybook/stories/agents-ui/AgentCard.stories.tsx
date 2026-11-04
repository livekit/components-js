import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { CarIcon } from 'lucide-react';
import {
  AgentCard,
  AgentCardDetail,
  AgentCardRow,
  AgentCardRows,
  AgentCardTotal,
  AgentCardProps,
} from '@livekit/agents-ui';

export default {
  component: AgentCard,
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    actions: { handles: [] },
  },
};

export const Order: StoryObj<AgentCardProps> = {
  args: { label: 'Your order' },
  render: (args) => (
    <AgentCard {...args}>
      <AgentCardRows>
        <AgentCardRow count={2} label="Margherita" value="$24.00" />
        <AgentCardRow count={1} label="Caesar salad" value="$11.50" />
        <AgentCardRow count={1} label="Garlic knots" value="$6.00" muted />
        <AgentCardTotal label="Total" value="$35.50" />
      </AgentCardRows>
      <AgentCardDetail icon={<CarIcon aria-hidden="true" />}>
        Delivering to 300 De Haro St
      </AgentCardDetail>
    </AgentCard>
  ),
};

export const Form: StoryObj<AgentCardProps> = {
  args: { label: 'New patient' },
  render: (args) => (
    <AgentCard {...args}>
      <AgentCardRows>
        <AgentCardRow mark="check" label="Name" value="Priya Shah" />
        <AgentCardRow mark="check" label="Insurance" value="BlueShield HMO" />
        <AgentCardRow mark="pending" label="Date of birth" current />
        <AgentCardRow mark="pending" label="Reason for visit" muted />
      </AgentCardRows>
    </AgentCard>
  ),
};

export const WithBadge: StoryObj<AgentCardProps> = {
  args: { label: 'Service ticket' },
  render: (args) => (
    <AgentCard {...args}>
      <AgentCardRows>
        <AgentCardRow
          label="Front brakes"
          badge={
            <span className="bg-destructive/10 text-destructive rounded-md px-1.5 py-0.5 text-xs">
              Urgent
            </span>
          }
          value="$180"
        />
        <AgentCardRow label="Oil change" value="$65" />
        <AgentCardTotal label="Estimate" value="$245" />
      </AgentCardRows>
    </AgentCard>
  ),
};
