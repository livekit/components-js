import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { animate } from 'motion/react';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { LiveAgentSessionProvider } from '../../.storybook/lk-decorators/LiveAgentSessionProvider';
import { AgentAudioVisualizerOrbit, AgentAudioVisualizerOrbitProps } from '@livekit/agents-ui';
import { useAgent, useAgentExpression, type AgentMood } from '@livekit/components-react';
import { useSimulatedVolumeBands } from './useSimulatedVolumeBands';

// Glue code: mapping mood -> color is deliberately kept out of the hook (state) and the
// visualizer (presentation) — it's wiring for this example, not a shared utility.
const MOOD_COLORS: Record<AgentMood, `#${string}`> = {
  angry: '#F5222D',
  excited: '#FF7A45',
  happy: '#FFC53D',
  playful: '#F759AB',
  surprised: '#B37FEB',
  anxious: '#D46B08',
  hopeful: '#52C41A',
  empathetic: '#36CFC9',
  curious: '#6600ff',
  sad: '#2F54EB',
  calm: '#1FD5F9',
};

type RgbaString = `rgba(${number}, ${number}, ${number}, ${number}, )`;

function rgbaToHex(colorString: RgbaString) {
  const rgbaValues = colorString.match(/[\d.]+/g);
  if (!rgbaValues) return null;

  const { r, g, b } = {
    r: parseInt(rgbaValues[0], 10),
    g: parseInt(rgbaValues[1], 10),
    b: parseInt(rgbaValues[2], 10),
  };

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

function useAnimatedColor(newColor: `#${string}`) {
  const prevColor = React.useRef(newColor);
  const [color, setColor] = React.useState(newColor);

  React.useEffect(() => {
    const controls = animate(prevColor.current, newColor, {
      duration: 1,
      ease: 'linear',
      onUpdate: (color: RgbaString) => {
        if (color.startsWith('#')) {
          return;
        }
        prevColor.current = newColor;
        setColor(rgbaToHex(color));
      },
    });
    return () => controls.stop();
  }, [newColor]);

  return color;
}

export default {
  component: AgentAudioVisualizerOrbit,
  decorators: [AgentSessionProvider],
  render: (args: AgentAudioVisualizerOrbitProps) => {
    const { microphoneTrack } = useAgent();

    return <AgentAudioVisualizerOrbit {...args} audioTrack={microphoneTrack} />;
  },
  args: {
    size: 'xl',
    color: '#1FD5F9',
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
    className: { control: { type: 'text' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<AgentAudioVisualizerOrbitProps> = {
  args: {},
};

// Demonstrates the `volume` override prop with a simulated speech waveform instead of
// live audio.
export const OverrideVolume: StoryObj<AgentAudioVisualizerOrbitProps> = {
  args: {
    state: 'speaking',
  },
  render: (args: AgentAudioVisualizerOrbitProps) => {
    const { microphoneTrack } = useAgent();
    const [volume] = useSimulatedVolumeBands(1);

    return <AgentAudioVisualizerOrbit {...args} audioTrack={microphoneTrack} volume={volume} />;
  },
};

/**
 * Needs a project and agent with Expressive Mode enabled, configured through the storybook env
 * vars the `LiveAgentSessionProvider` decorator reads.
 */
export const LiveAgentExpression: StoryObj<AgentAudioVisualizerOrbitProps> = {
  decorators: [LiveAgentSessionProvider],
  render: () => {
    const { microphoneTrack } = useAgent();
    const { mood, expression } = useAgentExpression();
    const targetColor = mood ? MOOD_COLORS[mood] : '#1FD5F9';
    const color = useAnimatedColor(targetColor);

    return (
      <div style={{ display: 'grid', gap: 24, justifyItems: 'center', padding: 32 }}>
        <AgentAudioVisualizerOrbit
          size="xl"
          state="speaking"
          color={color}
          audioTrack={microphoneTrack}
        />
        <div style={{ textAlign: 'center' }}>
          <div>mood: {mood ?? 'none'}</div>
          <div>expression: {expression ?? 'none'}</div>
        </div>
      </div>
    );
  },
};
