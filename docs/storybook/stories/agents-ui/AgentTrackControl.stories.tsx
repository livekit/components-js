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
        audioTrack={Track.Source.Microphone ?? microphoneTrack}
      />
    );
  },
  argTypes: {
    source: {
      options: [Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare],
      control: { type: 'select' },
    },
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

export const Microphone: StoryObj<AgentTrackControlProps> = {
  args: {
    kind: 'audioinput',
    source: Track.Source.Microphone,
  },
};

export const Camera: StoryObj<AgentTrackControlProps> = {
  args: {
    kind: 'videoinput',
    source: Track.Source.Camera,
  },
};

export const ScreenShare: StoryObj<AgentTrackControlProps> = {
  args: {
    source: Track.Source.ScreenShare,
  },
};
