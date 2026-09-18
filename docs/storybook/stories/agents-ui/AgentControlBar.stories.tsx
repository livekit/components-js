import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentControlBar, AgentControlBarProps } from '@agents-ui';

interface Args {
  variant: 'default' | 'outline' | 'livekit';
  isChatOpen: boolean;
  isConnected: boolean;
  'controls.microphone': boolean;
  'controls.camera': boolean;
  'controls.screenShare': boolean;
  'controls.chat': boolean;
  'controls.leave': boolean;
}

export default {
  component: AgentControlBar,
  decorators: [AgentSessionProvider],
  render: (args: Args) => {
    const props = {
      variant: args.variant,
      isChatOpen: args.isChatOpen,
      isConnected: args.isConnected,
      controls: {
        microphone: args['controls.microphone'],
        camera: args['controls.camera'],
        screenShare: args['controls.screenShare'],
        chat: args['controls.chat'],
        leave: args['controls.leave'],
      },
    };

    return <AgentControlBar {...props} className="min-w-lg  mx-auto" />;
  },
  args: {
    variant: 'livekit',
    isChatOpen: false,
    isConnected: true,
    'controls.microphone': true,
    'controls.camera': true,
    'controls.screenShare': true,
    'controls.chat': true,
    'controls.leave': true,
    className: 'w-full',
  },
  argTypes: {
    variant: {
      options: ['default', 'outline', 'livekit'],
      control: { type: 'radio' },
    },
    isChatOpen: { control: { type: 'boolean' } },
    isConnected: { control: { type: 'boolean' } },
    'controls.microphone': { control: { type: 'boolean' } },
    'controls.camera': { control: { type: 'boolean' } },
    'controls.screenShare': { control: { type: 'boolean' } },
    'controls.chat': { control: { type: 'boolean' } },
    'controls.leave': { control: { type: 'boolean' } },
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
