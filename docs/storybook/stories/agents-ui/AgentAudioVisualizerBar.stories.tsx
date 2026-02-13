import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { useSessionContext } from '@livekit/components-react';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import {
  AgentAudioVisualizerBar,
  AgentAudioVisualizerBarElementVariants,
  AgentAudioVisualizerBarProps,
} from '@agents-ui';
import { cn } from '@/lib/utils';

export default {
  component: AgentAudioVisualizerBar,
  decorators: [AgentSessionProvider],
  render: ({ color, ...args }: AgentAudioVisualizerBarProps & { color?: string }) => {
    const {
      local: { microphoneTrack },
    } = useSessionContext();

    return (
      <div style={{ color }}>
        <AgentAudioVisualizerBar {...args} audioTrack={microphoneTrack} />
      </div>
    );
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
  args: {},
};

export const Demo1: StoryObj<AgentAudioVisualizerBarProps> = {
  args: {
    color: '#F9B11F',
  },
};

export const Demo2: StoryObj<AgentAudioVisualizerBarProps> = {
  args: {
    color: '#1F8CF9',
    children: (
      <div className={cn(AgentAudioVisualizerBarElementVariants({ size: 'md' }), 'rounded-sm')} />
    ),
  },
};
