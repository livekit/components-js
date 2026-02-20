import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import {
  AgentAudioVisualizerGrid,
  AgentAudioVisualizerGridProps,
  AgentAudioVisualizerGridCellVariants,
} from '@agents-ui';
import { useSessionContext } from '@livekit/components-react';
import { cn } from '@/lib/utils';

export default {
  component: AgentAudioVisualizerGrid,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerGridProps) => {
    const {
      local: { microphoneTrack },
    } = useSessionContext();

    return <AgentAudioVisualizerGrid {...args} audioTrack={microphoneTrack} />;
  },
  args: {
    size: 'lg',
    state: 'connecting',
    radius: 5,
    interval: 100,
    rowCount: 9,
    columnCount: 9,
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
    radius: {
      control: { type: 'range', min: 1, max: 50, step: 1 },
    },
    interval: {
      control: { type: 'range', min: 1, max: 1000, step: 1 },
    },
    rowCount: {
      control: { type: 'range', min: 1, max: 40, step: 1 },
    },
    columnCount: {
      control: { type: 'range', min: 1, max: 40, step: 1 },
    },
    className: { control: { type: 'text' } },
    color: { control: { type: 'color' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {},
};

export const Demo1: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    className: 'gap-4',
    children: (
      <div
        className={cn(
          AgentAudioVisualizerGridCellVariants({ size: 'md' }),
          'data-[lk-highlighted=true]:bg-foreground data-[lk-highlighted=true]:scale-125',
          'shadow-[0_0_10px_2px_transparent] data-[lk-highlighted=true]:shadow-[0_0_10px_2px_var(--tw-shadow-color,currentColor)]',
        )}
      />
    ),
  },
};

export const Demo2: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    color: '#F9B11F',
    className: 'gap-2',
    children: (
      <div
        className={cn(
          AgentAudioVisualizerGridCellVariants({ size: 'md' }),
          'w-4 h-1 bg-foreground/10',
          'shadow-[0_0_10px_2px_transparent] data-[lk-highlighted=true]:shadow-[0_0_10px_2px_var(--tw-shadow-color,currentColor)]',
        )}
      />
    ),
  },
};

export const Demo3: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    color: '#1F8CF9',
    className: 'gap-4',
    children: (
      <div
        className={cn(
          AgentAudioVisualizerGridCellVariants({ size: 'md' }),
          'size-2 rounded-full bg-foreground/10',
          'shadow-[0_0_10px_2px_transparent] data-[lk-highlighted=true]:shadow-[0_0_10px_2px_var(--tw-shadow-color,currentColor)]',
        )}
      />
    ),
  },
};

export const Demo4: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    color: '#FFB6C1',
    className: 'gap-x-2.5 gap-y-1',
    children: (
      <div
        className={cn(
          AgentAudioVisualizerGridCellVariants({ size: 'md' }),
          'w-3 h-px my-2 rotate-45 bg-foreground/10 scale-100',
          'data-[lk-highlighted=true]:rotate-405 data-[lk-highlighted=true]:scale-200',
          'shadow-[0_0_10px_2px_transparent] data-[lk-highlighted=true]:shadow-[0_0_10px_2px_var(--tw-shadow-color,currentColor)]',
        )}
      />
    ),
  },
};
