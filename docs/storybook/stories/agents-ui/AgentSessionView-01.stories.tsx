import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { useTheme } from 'next-themes';
import { LiveAgentSessionProvider } from '../../.storybook/lk-decorators/LiveAgentSessionProvider';
import { AgentSessionView_01, AgentSessionView_01Props } from '@livekit/agents-ui';

interface Args extends Omit<
  AgentSessionView_01Props,
  'controls' | 'themeMode' | 'onDisconnect' | 'audioVisualizer'
> {
  'controls.leave': boolean;
  'controls.microphone': boolean;
  'controls.chat': boolean;
  'controls.camera': boolean;
  'controls.screenShare': boolean;
  'audioVisualizer.type': 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  'audioVisualizer.color': `#${string}` | undefined;
  'audioVisualizer.colorShift': number;
  'audioVisualizer.barCount': number;
  'audioVisualizer.rowCount': number;
  'audioVisualizer.columnCount': number;
  'audioVisualizer.radius': number;
  'audioVisualizer.lineWidth': number;
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
    'audioVisualizer.type': type,
    'audioVisualizer.color': color,
    'audioVisualizer.colorShift': colorShift,
    'audioVisualizer.barCount': barCount,
    'audioVisualizer.rowCount': rowCount,
    'audioVisualizer.columnCount': columnCount,
    'audioVisualizer.radius': radius,
    'audioVisualizer.lineWidth': lineWidth,
    ...args
  }: Args) => {
    const { resolvedTheme = 'dark' } = useTheme();
    return (
      <AgentSessionView_01
        themeMode={resolvedTheme as 'dark' | 'light'}
        {...args}
        controls={{ leave, microphone, chat, camera, screenShare }}
        audioVisualizer={
          {
            type,
            color,
            colorShift,
            barCount,
            rowCount,
            columnCount,
            radius,
            lineWidth,
          } as AgentSessionView_01Props['audioVisualizer']
        }
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
    'audioVisualizer.type': 'bar',
    'audioVisualizer.color': undefined,
    'audioVisualizer.colorShift': 0,
    'audioVisualizer.barCount': 5,
    'audioVisualizer.rowCount': 9,
    'audioVisualizer.columnCount': 9,
    'audioVisualizer.radius': 80,
    'audioVisualizer.lineWidth': 2,
  },
  argTypes: {
    'controls.leave': { control: { type: 'boolean' } },
    'controls.microphone': { control: { type: 'boolean' } },
    'controls.chat': { control: { type: 'boolean' } },
    'controls.camera': { control: { type: 'boolean' } },
    'controls.screenShare': { control: { type: 'boolean' } },
    isPreConnectBufferEnabled: { control: { type: 'boolean' } },
    preConnectMessage: { control: { type: 'text' } },
    'audioVisualizer.type': {
      options: ['bar', 'wave', 'grid', 'radial', 'aura'],
      control: { type: 'select' },
    },
    'audioVisualizer.color': { control: { type: 'color' } },
    'audioVisualizer.colorShift': { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
    'audioVisualizer.barCount': { control: { type: 'range', min: 1, max: 21, step: 1 } },
    'audioVisualizer.rowCount': { control: { type: 'range', min: 3, max: 21, step: 2 } },
    'audioVisualizer.columnCount': { control: { type: 'range', min: 3, max: 21, step: 2 } },
    'audioVisualizer.radius': { control: { type: 'range', min: 30, max: 120, step: 1 } },
    'audioVisualizer.lineWidth': { control: { type: 'range', min: 1, max: 10, step: 0.1 } },
  },
  parameters: {
    layout: 'fullscreen',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentSessionView_01Props> = {
  args: {},
};
