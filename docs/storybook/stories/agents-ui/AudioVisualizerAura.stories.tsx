import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AudioVisualizerAura, AudioVisualizerAuraProps } from '@agents-ui';

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
  component: AudioVisualizerAura,
  decorators: [AgentSessionProvider],
  render: ({ hexColor, ...args }: any) => {
    const audioTrack = useMicrophone();
    const rgbColor = mapHexToRgb(hexColor) as [number, number, number];

    return (
      <AudioVisualizerAura
        {...(args as Partial<AudioVisualizerAuraProps>)}
        rgbColor={rgbColor}
        audioTrack={audioTrack}
      />
    );
  },
  args: {
    size: 'xl',
    themeMode: 'dark',
    hexColor: '#1FD5F9',
    colorShift: 0.3,
    state: 'connecting',
  },
  argTypes: {
    size: {
      options: ['icon', 'sm', 'md', 'lg', 'xl'],
      control: { type: 'select' },
    },
    themeMode: {
      options: ['dark', 'light'],
      control: { type: 'select' },
    },
    hexColor: {
      control: { type: 'color' },
    },
    colorShift: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
    },
    state: {
      options: ['connecting', 'initializing', 'listening', 'thinking', 'speaking', 'idle'],
      control: { type: 'select' },
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

export const Default: StoryObj<AudioVisualizerAuraProps> = {
  args: {},
};
