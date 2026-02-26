import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentSessionView_01, AgentSessionView_01Props } from '@agents-ui';

export default {
  component: AgentSessionView_01,
  decorators: [AgentSessionProvider],
  render: (args: AgentSessionView_01Props) => <AgentSessionView_01 {...args} />,
  args: {
    className: 'h-screen w-screen',
    supportsChatInput: true,
    supportsVideoInput: true,
    supportsScreenShare: true,
    isPreConnectBufferEnabled: true,
    preConnectMessage: 'Agent is listening, ask it a question',
    audioVisualizerType: 'bar',
    audioVisualizerColor: undefined,
    audioVisualizerColorShift: 0,
    audioVisualizerBarCount: 5,
    audioVisualizerGridRowCount: 10,
    audioVisualizerGridColumnCount: 10,
    audioVisualizerRadialBarCount: 25,
    audioVisualizerRadialRadius: 80,
    audioVisualizerWaveLineWidth: 10,
  },
  argTypes: {
    supportsChatInput: { control: { type: 'boolean' } },
    supportsVideoInput: { control: { type: 'boolean' } },
    supportsScreenShare: { control: { type: 'boolean' } },
    isPreConnectBufferEnabled: { control: { type: 'boolean' } },
    preConnectMessage: { control: { type: 'text' } },
    audioVisualizerType: {
      control: { type: 'select', options: ['bar', 'wave', 'grid', 'radial', 'aura'] },
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
    layout: 'centered',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentSessionView_01Props> = {
  args: {},
};
