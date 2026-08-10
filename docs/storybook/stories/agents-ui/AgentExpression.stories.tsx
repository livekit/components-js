import * as React  from 'react';
import { StoryObj } from '@storybook/react-vite';
import { useTheme } from 'next-themes';
import { animate } from 'motion/react';
import { useAgent, useAgentExpression, type AgentMood } from '@livekit/components-react';
import { AgentAudioVisualizerAura } from '@livekit/agents-ui';
import { LiveAgentSessionProvider } from '../../.storybook/lk-decorators/LiveAgentSessionProvider';

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

/**
 * Needs a project and agent with Expressive Mode enabled, configured through the storybook env
 * vars the `LiveAgentSessionProvider` decorator reads.
 */
export default {
  title: 'agents-ui/AgentExpression',
  parameters: {
    layout: 'centered',
    actions: { handles: [] },
  },
};

export const LiveAgent: StoryObj = {
  decorators: [LiveAgentSessionProvider],
  render: () => {
    const { microphoneTrack } = useAgent();
    const { resolvedTheme = 'dark' } = useTheme();
    const { mood, expression } = useAgentExpression();
    const targetColor = mood ? MOOD_COLORS[mood] : '#1FD5F9';
    const color = useAnimatedColor(targetColor);

    return (
      <div style={{ display: 'grid', gap: 24, justifyItems: 'center', padding: 32 }}>
        <AgentAudioVisualizerAura
          size="xl"
          state="speaking"
          color={color}
          audioTrack={microphoneTrack}
          themeMode={resolvedTheme as 'dark' | 'light'}
        />
        <div style={{ textAlign: 'center' }}>
          <div>mood: {mood ?? 'none'}</div>
          <div>expression: {expression ?? 'none'}</div>
        </div>
      </div>
    );
  },
};
