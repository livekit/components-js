import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { useTheme } from 'next-themes';
import { animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import { useAgent, useAgentExpression, type AgentMood } from '@livekit/components-react';
import { AgentAudioVisualizerAura } from '@livekit/agents-ui';
import { LiveAgentSessionProvider } from '../../.storybook/lk-decorators/LiveAgentSessionProvider';

// Glue code: mapping mood -> color is deliberately kept out of the hook (state) and the
// visualizer (presentation) — it's wiring for this example, not a shared utility.
const MOOD_COLORS: Record<AgentMood, `#${string}`> = {
  excited: '#FF6B35',
  happy: '#FFD23F',
  playful: '#EE4B8A',
  curious: '#3AAED8',
  surprised: '#B565F3',
  hopeful: '#4ECDC4',
  empathetic: '#6C8EBF',
  sad: '#5C6B8A',
  angry: '#E4572E',
  anxious: '#9C6644',
  calm: '#1FD5F9',
};

function useAnimatedColor(color: `#${string}`) {
  const colorValue = useMotionValue(color);
  const [animatedColor, setAnimatedColor] = React.useState(color);

  useMotionValueEvent(colorValue, 'change', (latestColor) => {
    setAnimatedColor(latestColor as `#${string}`);
  });

  React.useEffect(() => {
    const controls = animate(colorValue, color, { duration: 3, ease: 'easeInOut' });
    return () => controls.stop();
  }, [color, colorValue]);

  return animatedColor;
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
    const targetColor = mood ? MOOD_COLORS[mood] : MOOD_COLORS.calm;
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
