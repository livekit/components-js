import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentControlBar, AgentControlBarProps } from '@agents-ui';

export default {
  component: AgentControlBar,
  decorators: [AgentSessionProvider],
  render: (args: AgentControlBarProps) => {
    useMicrophone();
    return <AgentControlBar {...args} className="min-w-lg  mx-auto" />;
  },
  args: {
    isConnected: true,
    controls: {
      microphone: true,
      camera: true,
      screenShare: true,
      chat: true,
      leave: true,
    },
    className: 'w-full',
  },
  argTypes: {
    controls: { control: { type: 'object' } },
    isConnected: { control: { type: 'boolean' } },
    isChatOpen: { control: { type: 'boolean' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentControlBarProps> = {
  args: {},
};

export const Outline: StoryObj<AgentControlBarProps> = {
  args: {
    variant: 'outline',
  },
};

export const Livekit: StoryObj<AgentControlBarProps> = {
  args: {
    variant: 'livekit',
  },
};

export const NoControls: StoryObj<AgentControlBarProps> = {
  args: {
    controls: {
      microphone: false,
      camera: false,
      screenShare: false,
      chat: false,
      leave: false,
    },
  },
  render: (args: AgentControlBarProps) => {
    return (
      <>
        <p className="text-center">
          This control bar does not render
          <br />
          because <code className="text-muted-foreground text-sm">visibleControls</code> contains
          only false values.
        </p>
        <AgentControlBar {...args} className="min-w-lg  mx-auto" />
      </>
    );
  },
};
