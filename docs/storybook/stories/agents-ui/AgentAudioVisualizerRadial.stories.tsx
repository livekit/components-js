import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerRadial, AgentAudioVisualizerRadialProps } from '@livekit/agents-ui';
import { useAgent } from '@livekit/components-react';
import { useSimulatedVolumeBands } from './useSimulatedVolumeBands';

export default {
  component: AgentAudioVisualizerRadial,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerRadialProps) => {
    const { microphoneTrack } = useAgent();

    return <AgentAudioVisualizerRadial {...args} audioTrack={microphoneTrack} />;
  },
  args: {
    size: 'lg',
    state: 'connecting',
    radius: undefined,
    color: undefined,
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
      control: { type: 'range', min: 4, max: 64, step: 1 },
    },
    radius: {
      control: { type: 'range', min: 1, max: 500, step: 1 },
    },
    color: { control: { type: 'color' } },
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

// Demonstrates the `volumeBands` override prop with a simulated speech waveform instead
// of live audio. The array length doesn't need to match `barCount` — it's trimmed or
// padded automatically.
export const OverrideVolumeBands: StoryObj<AgentAudioVisualizerRadialProps> = {
  args: {
    state: 'speaking',
    barCount: 24,
  },
  render: (args: AgentAudioVisualizerRadialProps) => {
    const { microphoneTrack } = useAgent();
    const volumeBands = useSimulatedVolumeBands(args.barCount ?? 24);

    return (
      <AgentAudioVisualizerRadial
        {...args}
        audioTrack={microphoneTrack}
        volumeBands={volumeBands}
      />
    );
  },
};
