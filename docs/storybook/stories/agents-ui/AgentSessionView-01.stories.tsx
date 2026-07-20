import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { within, userEvent } from 'storybook/test';
import { useTheme } from 'next-themes';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import {
  MockConversationMessage,
  withMockConversation,
} from '../../.storybook/lk-decorators/MockConversation';
import { AgentSessionView_01, AgentSessionView_01Props } from '@livekit/agents-ui';

const SAMPLE_CONVERSATION: MockConversationMessage[] = [
  { id: '1', from: 'agent', message: 'Hi, how can I help you today?' },
  { id: '2', from: 'user', message: 'Hi, how are you?' },
  { id: '3', from: 'agent', message: "I'm good, thank you!" },
  { id: '4', from: 'user', message: 'This is a longer message that should wrap to the next line.' },
  {
    id: '5',
    from: 'agent',
    message: "Great, I'm responding with an even longer message to see how it wraps.",
  },
  ...Array.from({ length: 15 }, (_, index) => ({
    id: `${6 + index}`,
    from: (index % 2 === 0 ? 'user' : 'agent') as MockConversationMessage['from'],
    message:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  })),
];

export default {
  component: AgentSessionView_01,
  decorators: [AgentSessionProvider],
  render: (args: AgentSessionView_01Props) => {
    const { resolvedTheme = 'dark' } = useTheme();
    return <AgentSessionView_01 themeMode={resolvedTheme as 'dark' | 'light'} {...args} />;
  },
  args: {
    className: 'h-screen',
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
    layout: 'fullscreen',
    actions: { handles: [] },
  },
};

export const Default: StoryObj<AgentSessionView_01Props> = {
  args: {},
};

export const WithConversation: StoryObj<AgentSessionView_01Props> = {
  decorators: [withMockConversation(SAMPLE_CONVERSATION)],
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const transcriptToggle = await canvas.findByRole('button', { name: 'Toggle transcript' });
    await userEvent.click(transcriptToggle);
  },
};
