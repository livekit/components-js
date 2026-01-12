import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerRadial, AgentAudioVisualizerRadialProps } from '@agents-ui';

export default {
  component: AgentAudioVisualizerRadial,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerRadialProps) => {
    const audioTrack = useMicrophone();

    return <AgentAudioVisualizerRadial {...args} audioTrack={audioTrack} />;
  },
  args: {
    size: 'lg',
    state: 'connecting',
    radius: undefined,
  },
  argTypes: {
    size: {
      options: ['icon', 'sm', 'md', 'lg', 'xl'],
      control: { type: 'radio' },
    },
    state: {
      options: [
        'idle',
        'disconnected',
        'pre-connect-buffering',
        'connecting',
        'initializing',
        'listening',
        'thinking',
        'speaking',
        'failed',
      ],
      control: { type: 'radio' },
    },
    barCount: {
      control: { type: 'range', min: 4, max: 64, step: 4 },
    },
    radius: {
      control: { type: 'range', min: 1, max: 500, step: 1 },
    },
    className: { control: { type: 'text' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentAudioVisualizerRadialProps> = {
  args: {},
};
