import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AudioVisualizerGrid, AudioVisualizerGridProps } from '@agents-ui';

export default {
  component: AudioVisualizerGrid,
  decorators: [AgentSessionProvider],
  render: (args: AudioVisualizerGridProps) => {
    const audioTrack = useMicrophone();

    return <AudioVisualizerGrid {...args} audioTrack={audioTrack} />;
  },
  args: {
    default: 'lg',
    state: 'connecting',
    radius: 5,
    interval: 100,
    rowCount: 10,
    columnCount: 10,
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

export const Demo1: StoryObj<AudioVisualizerGridProps> = {
  args: {
    className:
      'gap-4 [&_>_*]:size-1 [&_>_*]:rounded-full [&_>_*]:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-foreground [&_>_[data-lk-highlighted=true]]:scale-125 [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_10px_2px_rgba(255,255,255,0.4)]',
  },
};

export const Demo2: StoryObj<AudioVisualizerGridProps> = {
  args: {
    className:
      'gap-2 [&_>_*]:w-4 [&_>_*]:h-1 [&_>_*]:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-[#F9B11F] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_14.8px_2px_#F9B11F]',
  },
};

export const Demo3: StoryObj<AudioVisualizerGridProps> = {
  args: {
    className:
      'gap-4 [&_>_*]:size-2 [&_>_*]:rounded-full [&_>_*]:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-[#1F8CF9] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_14.8px_2px_#1F8CF9]',
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

export const Demo4: StoryObj<AudioVisualizerGridProps> = {
  args: {
    className:
      'gap-x-2.5 gap-y-1 [&_>_*]:w-3 [&_>_*]:h-px [&_>_*]:my-2 [&_>_*]:rotate-45 [&_>_*]:bg-foreground/10 [&_>_*]:rotate-45 [&_>_*]:scale-100 [&_>_[data-lk-highlighted=true]]:bg-[#FFB6C1] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_8px_2px_rgba(255,182,193,0.4)] [&_>_[data-lk-highlighted=true]]:rotate-[405deg] [&_>_[data-lk-highlighted=true]]:scale-200',
  },
};
