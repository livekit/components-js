import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AgentAudioVisualizerWave, AgentAudioVisualizerWaveProps } from '@livekit/agents-ui';
import { useAgent } from '@livekit/components-react';
import { useSimulatedVolumeBands } from './useSimulatedVolumeBands';

export default {
  component: AgentAudioVisualizerWave,
  render: (args: AgentAudioVisualizerWaveProps) => {
    const { microphoneTrack } = useAgent();

    return <AgentAudioVisualizerWave {...args} audioTrack={microphoneTrack} />;
  },
  args: {
    size: 'xl',
    lineWidth: 2,
    state: 'connecting',
    blur: 0.1,
    color: '#1FD5F9',
    colorShift: 0.3,
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
    blur: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
    },
    color: {
      control: { type: 'color' },
    },
    colorShift: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
    },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentAudioVisualizerWaveProps> = {
  decorators: [AgentSessionProvider],
  args: {},
};

// Demonstrates the `volume` override prop with a simulated speech waveform instead of
// live audio.
export const OverrideVolume: StoryObj<AgentAudioVisualizerWaveProps> = {
  decorators: [AgentSessionProvider],
  args: {
    state: 'speaking',
  },
  render: (args: AgentAudioVisualizerWaveProps) => {
    const { microphoneTrack } = useAgent();
    const [volume] = useSimulatedVolumeBands(1);

    return <AgentAudioVisualizerWave {...args} audioTrack={microphoneTrack} volume={volume} />;
  },
};

// No room or microphone required. Change the browser's prefers-reduced-motion
// emulation (or the OS preference) while this story is open to compare both modes.
export const MotionPreferences: StoryObj<AgentAudioVisualizerWaveProps> = {
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Enable prefers-reduced-motion in browser developer tools or your OS settings. The waves become still, state-specific silhouettes: no travel, pulsing, or volume-driven deformation. Change the preference without reloading to resume animation. Simulated volume needs no LiveKit connection.',
      },
    },
  },
  render: (args: AgentAudioVisualizerWaveProps) => {
    const [volume] = useSimulatedVolumeBands(1);
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(['disconnected', 'listening', 'thinking', 'speaking'] as const).map((state) => (
          <figure key={state} className="flex flex-col items-center rounded-lg border p-4">
            <AgentAudioVisualizerWave
              {...args}
              size="md"
              state={state}
              volume={volume}
              aria-hidden="true"
            />
            <figcaption className="text-sm capitalize">{state}</figcaption>
          </figure>
        ))}
      </div>
    );
  },
};
