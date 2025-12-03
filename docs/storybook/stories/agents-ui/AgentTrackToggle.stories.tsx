import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentTrackToggle, AgentTrackToggleProps } from '@agents-ui';
import { Track } from 'livekit-client';

export default {
  component: AgentTrackToggle,
  decorators: [AgentSessionProvider],
  render: (args: AgentTrackToggleProps) => {
    const [isPressed, setIsPressed] = React.useState(
      args.source === Track.Source.Microphone ? true : false,
    );

    return (
      <AgentTrackToggle
        {...args}
        pressed={isPressed}
        onPressedChange={(pressed: boolean) => setIsPressed(pressed)}
      />
    );
  },
  argTypes: {
    onChange: { action: 'onchange' },
    pending: { control: { type: 'boolean' } },
    className: { control: { type: 'text' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Microphone: StoryObj<AgentTrackToggleProps> = {
  args: {
    source: Track.Source.Microphone,
  },
};

export const Camera: StoryObj<AgentTrackToggleProps> = {
  args: {
    source: Track.Source.Camera,
  },
};

export const ScreenShare: StoryObj<AgentTrackToggleProps> = {
  args: {
    source: Track.Source.ScreenShare,
  },
};
