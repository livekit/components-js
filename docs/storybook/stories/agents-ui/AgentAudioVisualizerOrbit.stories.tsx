import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerOrbit, AgentAudioVisualizerOrbitProps } from '@livekit/agents-ui';
import { useAgent } from '@livekit/components-react';
import { useSimulatedVolumeBands } from './useSimulatedVolumeBands';

export default {
  component: AgentAudioVisualizerOrbit,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerOrbitProps) => {
    const { microphoneTrack } = useAgent();

    return <AgentAudioVisualizerOrbit {...args} audioTrack={microphoneTrack} />;
  },
  args: {
    size: 'xl',
    color: '#1FD5F9',
    state: 'connecting',
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
    color: {
      control: { type: 'color' },
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

export const Default: StoryObj<AgentAudioVisualizerOrbitProps> = {
  args: {},
};

// Demonstrates the `volume` override prop with a simulated speech waveform instead of
// live audio.
export const OverrideVolume: StoryObj<AgentAudioVisualizerOrbitProps> = {
  args: {
    state: 'speaking',
  },
  render: (args: AgentAudioVisualizerOrbitProps) => {
    const { microphoneTrack } = useAgent();
    const [volume] = useSimulatedVolumeBands(1);

    return <AgentAudioVisualizerOrbit {...args} audioTrack={microphoneTrack} volume={volume} />;
  },
};
