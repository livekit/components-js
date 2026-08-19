import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import {
  AgentAudioVisualizerMeshGradient,
  AgentAudioVisualizerMeshGradientProps,
} from '@agents-ui';
import { useAgent } from '@livekit/components-react';

export default {
  component: AgentAudioVisualizerMeshGradient,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerMeshGradientProps) => {
    const { microphoneTrack } = useAgent();

    return (
      <AgentAudioVisualizerMeshGradient
        {...args}
        audioTrack={microphoneTrack}
        className="rounded-full overflow-clip"
      />
    );
  },
  args: {
    size: 'xl',
    colors: ['#1FD5F9', '#2E7BF6', '#7C5CFC', '#1250C4'],
    state: 'connecting',
    grain: 0,
    scale: 1,
    distortion: 1,
    swirl: 1,
    rotation: 0,
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
    colors: {
      control: { type: 'object' },
    },
    grain: {
      control: { type: 'range', min: 0, max: 2, step: 0.05 },
    },
    scale: {
      control: { type: 'range', min: 0.25, max: 3, step: 0.05 },
    },
    distortion: {
      control: { type: 'range', min: 0, max: 2, step: 0.05 },
    },
    swirl: {
      control: { type: 'range', min: 0, max: 2, step: 0.05 },
    },
    rotation: {
      control: { type: 'range', min: 0, max: 360, step: 1 },
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

export const Default: StoryObj<AgentAudioVisualizerMeshGradientProps> = {
  args: {},
};

export const Sunset: StoryObj<AgentAudioVisualizerMeshGradientProps> = {
  args: {
    colors: ['#FF6B6B', '#FFA94D', '#FF8CC6', '#845EF7'],
  },
};

export const Ocean: StoryObj<AgentAudioVisualizerMeshGradientProps> = {
  args: {
    colors: ['#0369A1', '#0EA5E9', '#22D3EE', '#14B8A6'],
  },
};

export const Aurora: StoryObj<AgentAudioVisualizerMeshGradientProps> = {
  args: {
    colors: ['#22D3EE', '#34D399', '#A78BFA', '#818CF8'],
  },
};

export const Monochrome: StoryObj<AgentAudioVisualizerMeshGradientProps> = {
  args: {
    colors: ['#F8FAFC00', '#94A3B8', '#1E293B', '#020617'],
  },
};
