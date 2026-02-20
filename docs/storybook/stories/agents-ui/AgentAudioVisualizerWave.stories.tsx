import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerWave, AgentAudioVisualizerWaveProps } from '@agents-ui';
import { useSessionContext } from '@livekit/components-react';

export default {
  component: AgentAudioVisualizerWave,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerWaveProps) => {
    const {
      local: { microphoneTrack },
    } = useSessionContext();

    return <AgentAudioVisualizerWave {...args} audioTrack={microphoneTrack} />;
  },
  args: {
    size: 'xl',
    lineWidth: 2,
    state: 'connecting',
    blur: 0.1,
    color: '#1FD5F9',
    colorShift: 0.3,
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
    blur: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
    },
    color: {
      control: { type: 'color' },
    },
    colorShift: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
    },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentAudioVisualizerWaveProps> = {
  args: {},
};
