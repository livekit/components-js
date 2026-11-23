import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerSmoke, AgentAudioVisualizerSmokeProps } from '@livekit/agents-ui';
import { useTheme } from 'next-themes';
import { useAgent } from '@livekit/components-react';
import { useSimulatedVolumeBands } from './useSimulatedVolumeBands';

export default {
  component: AgentAudioVisualizerSmoke,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerSmokeProps) => {
    const { microphoneTrack } = useAgent();
    const { resolvedTheme = 'dark' } = useTheme();

    return (
      <AgentAudioVisualizerSmoke
        {...args}
        audioTrack={microphoneTrack}
        themeMode={resolvedTheme as 'dark' | 'light'}
      />
    );
  },
  args: {
    size: 'xl',
    color: '#2CEAED',
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

export const Default: StoryObj<AgentAudioVisualizerSmokeProps> = {
  args: {},
};

// Omits `themeMode`, so Smoke follows the `dark` class that the theme toolbar sets on `<html>`.
export const PageTheme: StoryObj<AgentAudioVisualizerSmokeProps> = {
  render: (args: AgentAudioVisualizerSmokeProps) => {
    const { microphoneTrack } = useAgent();

    return <AgentAudioVisualizerSmoke {...args} audioTrack={microphoneTrack} />;
  },
};

// Demonstrates the `volume` override prop with a simulated speech waveform instead of
// live audio.
export const OverrideVolume: StoryObj<AgentAudioVisualizerSmokeProps> = {
  args: {
    state: 'speaking',
  },
  render: (args: AgentAudioVisualizerSmokeProps) => {
    const { microphoneTrack } = useAgent();
    const { resolvedTheme = 'dark' } = useTheme();
    const [volume] = useSimulatedVolumeBands(1);

    return (
      <AgentAudioVisualizerSmoke
        {...args}
        audioTrack={microphoneTrack}
        volume={volume}
        themeMode={resolvedTheme as 'dark' | 'light'}
      />
    );
  },
};
