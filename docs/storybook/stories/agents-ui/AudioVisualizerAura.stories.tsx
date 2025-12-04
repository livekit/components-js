import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AudioVisualizerAura, AudioVisualizerAuraProps } from '@agents-ui';
import { useTheme } from 'next-themes';

export default {
  component: AudioVisualizerAura,
  decorators: [AgentSessionProvider],
  render: (args: AudioVisualizerAuraProps) => {
    const audioTrack = useMicrophone();
    const { theme } = useTheme();
    const themeMode = theme === 'dark' ? 'dark' : 'light';

    return <AudioVisualizerAura {...args} themeMode={themeMode} audioTrack={audioTrack} />;
  },
  args: {
    size: 'xl',
    themeMode: 'dark',
    color: '#1FD5F9',
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
    color: {
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
