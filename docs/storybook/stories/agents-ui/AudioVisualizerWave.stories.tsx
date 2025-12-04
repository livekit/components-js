import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AudioVisualizerWave, AudioVisualizerWaveProps } from '@agents-ui';

const mapHexToRgb = (hexColor: string) => {
  try {
    const rgbColor = hexColor.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);

    if (rgbColor) {
      const [, r, g, b] = rgbColor;
      const color = [r, g, b].map((c) => parseInt(c, 16) / 255);

      return color;
    }
  } catch (error) {
    console.error(error);
    return [31.0 / 255, 213.0 / 255, 249.0 / 255];
  }
};

export default {
  component: AudioVisualizerWave,
  decorators: [AgentSessionProvider],
  render: ({ hexColor, ...args }: any) => {
    const audioTrack = useMicrophone();
    const rgbColor = mapHexToRgb(hexColor) as [number, number, number];

    return (
      <AudioVisualizerWave
        {...(args as Partial<AudioVisualizerWaveProps>)}
        rgbColor={rgbColor}
        audioTrack={audioTrack}
      />
    );
  },
  args: {
    size: 'xl',
    lineWidth: 2,
    state: 'connecting',
    smoothing: 0.1,
    hexColor: '#1FD5F9',
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
    smoothing: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
    },
    hexColor: {
      control: { type: 'color' },
    },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AudioVisualizerWaveProps> = {
  args: {},
};
