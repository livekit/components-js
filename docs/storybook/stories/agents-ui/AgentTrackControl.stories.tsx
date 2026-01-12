import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentTrackControl, type AgentTrackControlProps } from '@agents-ui';
import { Track } from 'livekit-client';

export default {
  component: AgentTrackControl,
  decorators: [AgentSessionProvider],
  render: (args: AgentTrackControlProps) => {
    const [isPressed, setIsPressed] = React.useState(
      args.source === Track.Source.Microphone ? true : false,
    );

    const microphoneTrack = useMicrophone();

    return (
      <AgentTrackControl
        {...args}
        pressed={isPressed}
        onPressedChange={(pressed: boolean) => setIsPressed(pressed)}
        audioTrack={args.source === Track.Source.Microphone ? microphoneTrack : undefined}
      />
    );
  },
  argTypes: {
    variant: {
      options: ['default', 'outline'],
      control: { type: 'select' },
    },
    source: {
      options: ['microphone', 'camera', 'screen_share'],
      control: { type: 'select' },
    },
    pressed: { control: { type: 'boolean' } },
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

export const Default: StoryObj<AgentTrackControlProps> = {
  render: (args: AgentTrackControlProps) => {
    const [isCameraPressed, setIsCameraPressed] = React.useState(true);
    const [isMicrophonePressed, setIsMicrophonePressed] = React.useState(false);
    const [isScreenSharePressed, setIsScreenSharePressed] = React.useState(true);

    const microphoneTrack = useMicrophone();

    return (
      <div className="flex gap-2">
        <AgentTrackControl
          {...args}
          kind="audioinput"
          source={Track.Source.Microphone}
          pressed={isMicrophonePressed}
          audioTrack={microphoneTrack}
          onPressedChange={(pressed: boolean) => setIsMicrophonePressed(pressed)}
        />
        <AgentTrackControl
          {...args}
          kind="videoinput"
          source={Track.Source.Camera}
          pressed={isCameraPressed}
          onPressedChange={(pressed: boolean) => setIsCameraPressed(pressed)}
        />
        <AgentTrackControl
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

export const Outlined: StoryObj<AgentTrackControlProps> = {
  args: {
    variant: 'outline',
  },
  render: (args: AgentTrackControlProps) => {
    const [isCameraPressed, setIsCameraPressed] = React.useState(true);
    const [isMicrophonePressed, setIsMicrophonePressed] = React.useState(false);
    const [isScreenSharePressed, setIsScreenSharePressed] = React.useState(true);

    const microphoneTrack = useMicrophone();

    return (
      <div className="flex gap-2">
        <AgentTrackControl
          {...args}
          kind="audioinput"
          source={Track.Source.Microphone}
          pressed={isMicrophonePressed}
          audioTrack={args.source === Track.Source.Microphone ? microphoneTrack : undefined}
          onPressedChange={(pressed: boolean) => setIsMicrophonePressed(pressed)}
        />
        <AgentTrackControl
          {...args}
          kind="videoinput"
          source={Track.Source.Camera}
          pressed={isCameraPressed}
          onPressedChange={(pressed: boolean) => setIsCameraPressed(pressed)}
        />
        <AgentTrackControl
          {...args}
          source={Track.Source.ScreenShare}
          pressed={isScreenSharePressed}
          onPressedChange={(pressed: boolean) => setIsScreenSharePressed(pressed)}
        />
      </div>
    );
  },
};
