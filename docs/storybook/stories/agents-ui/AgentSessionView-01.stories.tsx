import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { useTheme } from 'next-themes';
import { LiveAgentSessionProvider } from '../../.storybook/lk-decorators/LiveAgentSessionProvider';
import { AgentSessionView_01, AgentSessionView_01Props } from '@livekit/agents-ui';

interface Args extends Omit<AgentSessionView_01Props, 'controls' | 'themeMode' | 'onDisconnect'> {
  'controls.leave': boolean;
  'controls.microphone': boolean;
  'controls.chat': boolean;
  'controls.camera': boolean;
  'controls.screenShare': boolean;
}

export default {
  title: 'agents-ui/Blocks/AgentSessionView-01',
  component: AgentSessionView_01,
  decorators: [LiveAgentSessionProvider],
  render: ({
    'controls.leave': leave,
    'controls.microphone': microphone,
    'controls.chat': chat,
    'controls.camera': camera,
    'controls.screenShare': screenShare,
    ...args
  }: Args) => {
    const { resolvedTheme = 'dark' } = useTheme();
    return (
      <AgentSessionView_01
        themeMode={resolvedTheme as 'dark' | 'light'}
        {...args}
        controls={{ leave, microphone, chat, camera, screenShare }}
      />
    );
  },
  args: {
    className: 'h-screen',
    'controls.leave': true,
    'controls.microphone': true,
    'controls.chat': true,
    'controls.camera': true,
    'controls.screenShare': true,
    isPreConnectBufferEnabled: true,
    preConnectMessage: 'Agent is listening, ask it a question',
    audioVisualizerType: 'bar',
    audioVisualizerColor: undefined,
    audioVisualizerColorShift: 0,
    audioVisualizerBarCount: 5,
    audioVisualizerGridRowCount: 9,
    audioVisualizerGridColumnCount: 9,
    audioVisualizerRadialBarCount: 25,
    audioVisualizerRadialRadius: 80,
    audioVisualizerWaveLineWidth: 2,
  },
  argTypes: {
    'controls.leave': { control: { type: 'boolean' } },
    'controls.microphone': { control: { type: 'boolean' } },
    'controls.chat': { control: { type: 'boolean' } },
    'controls.camera': { control: { type: 'boolean' } },
    'controls.screenShare': { control: { type: 'boolean' } },
    isPreConnectBufferEnabled: { control: { type: 'boolean' } },
    preConnectMessage: { control: { type: 'text' } },
    audioVisualizerType: {
      options: ['bar', 'wave', 'grid', 'radial', 'aura'],
      control: { type: 'select' },
    },
    audioVisualizerColor: { control: { type: 'color' } },
    audioVisualizerColorShift: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
    audioVisualizerBarCount: { control: { type: 'range', min: 1, max: 21, step: 1 } },
    audioVisualizerGridRowCount: { control: { type: 'range', min: 3, max: 21, step: 2 } },
    audioVisualizerGridColumnCount: { control: { type: 'range', min: 3, max: 21, step: 2 } },
    audioVisualizerRadialBarCount: { control: { type: 'range', min: 4, max: 64, step: 4 } },
    audioVisualizerRadialRadius: { control: { type: 'range', min: 30, max: 120, step: 1 } },
    audioVisualizerWaveLineWidth: { control: { type: 'range', min: 1, max: 10, step: 0.1 } },
  },
  parameters: {
    layout: 'fullscreen',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentSessionView_01Props> = {
  args: {},
};
