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
  args: {
    size: 'default',
  },
  argTypes: {
    size: {
      options: ['default', 'sm', 'lg'],
      control: { type: 'radio' },
    },
    variant: {
      options: ['default', 'outline'],
    },
    source: {
      options: ['microphone', 'camera', 'screen_share'],
      control: { type: 'select' },
    },
    pending: { control: { type: 'boolean' } },
    pressed: { control: { type: 'boolean' } },
    disabled: { control: { type: 'boolean' } },
    defaultPressed: { control: { type: 'boolean' } },
    className: { control: { type: 'text' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentTrackToggleProps> = {
  render: (args: AgentTrackToggleProps) => {
    const [isCameraPressed, setIsCameraPressed] = React.useState(true);
    const [isMicrophonePressed, setIsMicrophonePressed] = React.useState(false);
    const [isScreenSharePressed, setIsScreenSharePressed] = React.useState(true);

    return (
      <div className="flex gap-2">
        <AgentTrackToggle
          {...args}
          source={Track.Source.Microphone}
          pressed={isMicrophonePressed}
          onPressedChange={(pressed: boolean) => setIsMicrophonePressed(pressed)}
        />
        <AgentTrackToggle
          {...args}
          source={Track.Source.Camera}
          pressed={isCameraPressed}
          onPressedChange={(pressed: boolean) => setIsCameraPressed(pressed)}
        />
        <AgentTrackToggle
          {...args}
          source={Track.Source.ScreenShare}
          pressed={isScreenSharePressed}
          onPressedChange={(pressed: boolean) => setIsScreenSharePressed(pressed)}
        />
      </div>
    );
  },
  args: {},
};

export const Outlined: StoryObj<AgentTrackToggleProps> = {
  args: {
    variant: 'outline',
  },
  render: (args: AgentTrackToggleProps) => {
    const [isCameraPressed, setIsCameraPressed] = React.useState(true);
    const [isMicrophonePressed, setIsMicrophonePressed] = React.useState(false);
    const [isScreenSharePressed, setIsScreenSharePressed] = React.useState(true);

    return (
      <div className="flex gap-2">
        <AgentTrackToggle
          {...args}
          source={Track.Source.Microphone}
          pressed={isMicrophonePressed}
          onPressedChange={(pressed: boolean) => setIsMicrophonePressed(pressed)}
        />
        <AgentTrackToggle
          {...args}
          source={Track.Source.Camera}
          pressed={isCameraPressed}
          onPressedChange={(pressed: boolean) => setIsCameraPressed(pressed)}
        />
        <AgentTrackToggle
          {...args}
          source={Track.Source.ScreenShare}
          pressed={isScreenSharePressed}
          onPressedChange={(pressed: boolean) => setIsScreenSharePressed(pressed)}
        />
      </div>
    );
  },
};
