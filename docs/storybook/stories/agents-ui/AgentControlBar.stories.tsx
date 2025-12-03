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
  argTypes: {
    controls: { control: { type: 'object' } },
    isConnected: { control: { type: 'boolean' } },
    isChatOpen: { control: { type: 'boolean' } },
    onDisconnect: { action: 'onDisconnect' },
    onDeviceError: { action: 'onDeviceError' },
    // onIsChatOpenChange: { action: 'onIsChatOpenChange' },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentControlBarProps> = {
  args: {
    controls: {
      microphone: true,
      camera: true,
      screenShare: true,
      chat: true,
      leave: true,
    },
    saveUserChoices: true,
    className: 'w-full',
  },
};
