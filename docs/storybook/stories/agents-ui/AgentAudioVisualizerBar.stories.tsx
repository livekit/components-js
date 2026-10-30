import { ReducedMotionVisualizer } from '../../.storybook/lk-decorators/ReducedMotionVisualizer';
import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { useAgent } from '@livekit/components-react';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerBar, AgentAudioVisualizerBarProps } from '@livekit/agents-ui';
import { useSimulatedVolumeBands } from './useSimulatedVolumeBands';

export default {
  component: AgentAudioVisualizerBar,
  render: (args: AgentAudioVisualizerBarProps) => {
    const { microphoneTrack } = useAgent();

    return <AgentAudioVisualizerBar {...args} audioTrack={microphoneTrack} />;
  },
  args: {
    size: 'xl',
    barCount: 5,
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
    barCount: {
      control: { type: 'range', min: 1, max: 24, step: 1 },
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

export const Default: StoryObj<AgentAudioVisualizerBarProps> = {
  decorators: [AgentSessionProvider],
  args: {},
};

// Demonstrates the `volumeBands` override prop with a simulated speech waveform instead
// of live audio. The array length doesn't need to match `barCount` — it's trimmed or
// padded automatically.
export const OverrideVolumeBands: StoryObj<AgentAudioVisualizerBarProps> = {
  decorators: [AgentSessionProvider],
  args: {
    state: 'speaking',
    barCount: 5,
  },
  render: (args: AgentAudioVisualizerBarProps) => {
    const { microphoneTrack } = useAgent();
    const volumeBands = useSimulatedVolumeBands(args.barCount ?? 5);

    return (
      <AgentAudioVisualizerBar {...args} audioTrack={microphoneTrack} volumeBands={volumeBands} />
    );
  },
};

export const ReducedMotion: StoryObj<AgentAudioVisualizerBarProps> = {
  args: { state: 'listening', size: 'md' },
  render: (args: AgentAudioVisualizerBarProps) => (
    <ReducedMotionVisualizer>
      {(paused) => <AgentAudioVisualizerBar {...args} paused={paused} />}
    </ReducedMotionVisualizer>
  ),
};
