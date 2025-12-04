import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AudioVisualizerAura, AudioVisualizerAuraProps } from '@agents-ui';
import { useTheme } from 'next-themes';

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
    const { theme } = useTheme();
    const themeMode = theme === 'dark' ? 'dark' : 'light';

    return (
      <AudioVisualizerAura
        {...(args as Partial<AudioVisualizerAuraProps>)}
        rgbColor={rgbColor}
        themeMode={themeMode}
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
    hexColor: {
      control: { type: 'color' },
    },
    colorShift: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
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
