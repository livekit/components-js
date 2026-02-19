import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerAura, AgentAudioVisualizerAuraProps } from '@agents-ui';
import { useTheme } from 'next-themes';
import { useSessionContext } from '@livekit/components-react';

export default {
  component: AgentAudioVisualizerAura,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerAuraProps) => {
    const {
      local: { microphoneTrack },
    } = useSessionContext();
    const { resolvedTheme = 'dark' } = useTheme();

    return (
      <AgentAudioVisualizerAura
        {...args}
        audioTrack={microphoneTrack}
        themeMode={resolvedTheme as 'dark' | 'light'}
      />
    );
  },
  args: {
    size: 'xl',
    color: '#1FD5F9',
    colorShift: 0.1,
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
      control: { type: 'range', min: 0, max: 2, step: 0.01 },
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

export const Default: StoryObj<AgentAudioVisualizerAuraProps> = {
  args: {},
};
