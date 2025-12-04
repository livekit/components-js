import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AudioVisualizerWave, AudioVisualizerWaveProps } from '@agents-ui';

export default {
  component: AudioVisualizerWave,
  decorators: [AgentSessionProvider],
  render: (args: AudioVisualizerWaveProps) => {
    const audioTrack = useMicrophone();

    return <AudioVisualizerWave {...args} audioTrack={audioTrack} />;
  },
  args: {
    size: 'xl',
    lineWidth: 2,
    state: 'connecting',
    smoothing: 0.1,
    color: '#1FD5F9',
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
    lineWidth: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    smoothing: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
    },
    color: {
      control: { type: 'color' },
    },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AudioVisualizerWaveProps> = {
  args: {},
};
