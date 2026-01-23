import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerGrid, AgentAudioVisualizerGridProps } from '@agents-ui';
import { useSessionContext } from '@livekit/components-react';

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
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    
  },
};

export const Demo1: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    className:
      'gap-4 *:size-1 *:rounded-full *:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-foreground [&_>_[data-lk-highlighted=true]]:scale-125 [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_10px_2px_rgba(255,255,255,0.4)]',
  },
};

export const Demo2: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    className:
      'gap-2 *:w-4 *:h-1 *:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-[#F9B11F] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_14.8px_2px_#F9B11F]',
  },
};

export const Demo3: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    className:
      'gap-4 *:size-2 *:rounded-full *:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-[#1F8CF9] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_14.8px_2px_#1F8CF9]',
    transformer: (index: number, rowCount: number, columnCount: number) => {
      const rowMidPoint = Math.floor(rowCount / 2);
      const distanceFromCenter = Math.sqrt(
        Math.pow(rowMidPoint - (index % columnCount), 2) +
          Math.pow(rowMidPoint - Math.floor(index / columnCount), 2),
      );

      return {
        opacity: 1 - distanceFromCenter / columnCount,
        transform: `scale(${1 - (distanceFromCenter / (columnCount * 2)) * 1.75})`,
      };
    },
  },
};

export const Demo4: StoryObj<AgentAudioVisualizerGridProps> = {
  args: {
    className:
      'gap-x-2.5 gap-y-1 *:w-3 *:h-px *:my-2 *:rotate-45 *:bg-foreground/10 *:rotate-45 *:scale-100 [&_>_[data-lk-highlighted=true]]:bg-[#FFB6C1] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_8px_2px_rgba(255,182,193,0.4)] [&_>_[data-lk-highlighted=true]]:rotate-[405deg] [&_>_[data-lk-highlighted=true]]:scale-200',
  },
};
