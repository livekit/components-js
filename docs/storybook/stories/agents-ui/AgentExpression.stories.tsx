import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { LiveAgentSessionProvider } from '../../.storybook/lk-decorators/LiveAgentSessionProvider';
import {
  AgentAudioVisualizerAura,
  AgentAudioVisualizerBar,
  AgentAudioVisualizerGrid,
  AgentAudioVisualizerRadial,
  AgentAudioVisualizerWave,
  DEFAULT_PRIMARY_COLOR,
  MOOD_COLORS,
  moodColor,
  useExpression,
  type AgentMood,
  type MoodColorOptions,
  type UseExpressionOptions,
} from '@livekit/agents-ui';
import { useTheme } from 'next-themes';
import { useAgent } from '@livekit/components-react';
import { useSimulatedVolumeBands } from './useSimulatedVolumeBands';

const MOODS = Object.keys(MOOD_COLORS) as AgentMood[];

type Args = MoodColorOptions & { mood?: AgentMood };

/** The current mood, in the mood's own color. */
function MoodReadout({
  color,
  mood,
  label,
}: {
  color: string;
  mood: AgentMood | null;
  label?: string | null;
}) {
  return (
    <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
      <div style={{ color, fontSize: 28, fontWeight: 600, transition: 'color 250ms linear' }}>
        {mood ?? 'neutral'}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.6 }}>
        {label ?? 'no expression yet'} · {color}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure
      style={{
        margin: 0,
        padding: 24,
        display: 'grid',
        gap: 16,
        justifyItems: 'center',
        alignContent: 'center',
        minHeight: 220,
        border: '1px solid rgba(128, 128, 128, 0.25)',
        borderRadius: 12,
      }}
    >
      {children}
      <figcaption style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.6 }}>
        {title}
      </figcaption>
    </figure>
  );
}

export default {
  title: 'agents-ui/AgentExpression',
  args: {
    mood: 'excited' as AgentMood,
    primary: DEFAULT_PRIMARY_COLOR,
    blend: 0.75,
  },
  argTypes: {
    mood: { options: MOODS, control: { type: 'select' } },
    primary: { control: { type: 'color' } },
    blend: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  parameters: { layout: 'fullscreen' },
};

/**
 * One color driving every visualizer. Nothing here is expression-specific: `moodColor` turns a
 * mood into a color and each visualizer just takes a `color`.
 */
export const AnyVisualizer: StoryObj<Args> = {
  render: (args: Args) => {
    const { resolvedTheme = 'dark' } = useTheme();
    const [volume] = useSimulatedVolumeBands(1);
    const color = moodColor(args.mood ?? null, args);
    const themeMode = resolvedTheme as 'dark' | 'light';

    return (
      <div style={{ display: 'grid', gap: 32, padding: 32, justifyItems: 'center' }}>
        <MoodReadout color={color} mood={args.mood ?? null} label={args.mood} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
            width: '100%',
          }}
        >
          <Panel title="AgentAudioVisualizerAura">
            <AgentAudioVisualizerAura
              size="md"
              state="speaking"
              color={color}
              volume={volume}
              themeMode={themeMode}
            />
          </Panel>
          <Panel title="AgentAudioVisualizerBar">
            <AgentAudioVisualizerBar state="speaking" color={color} volume={volume} />
          </Panel>
          <Panel title="AgentAudioVisualizerGrid">
            <AgentAudioVisualizerGrid state="speaking" color={color} volume={volume} />
          </Panel>
          <Panel title="AgentAudioVisualizerRadial">
            <AgentAudioVisualizerRadial state="speaking" color={color} volume={volume} />
          </Panel>
          <Panel title="AgentAudioVisualizerWave">
            <AgentAudioVisualizerWave
              state="speaking"
              color={color}
              volume={volume}
              themeMode={themeMode}
            />
          </Panel>
        </div>
      </div>
    );
  },
};

/**
 * Every mood side by side, each labelled in its own color. This is the story for judging whether
 * the palette reads as a set.
 */
export const Palette: StoryObj<Args> = {
  render: (args: Args) => {
    const { resolvedTheme = 'dark' } = useTheme();
    const [volume] = useSimulatedVolumeBands(1);

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
          padding: 32,
        }}
      >
        {MOODS.map((mood) => {
          const color = moodColor(mood, { primary: args.primary, blend: args.blend });
          return (
            <Panel key={mood} title={color}>
              <AgentAudioVisualizerAura
                size="md"
                state="speaking"
                color={color}
                volume={volume}
                themeMode={resolvedTheme as 'dark' | 'light'}
              />
              <div style={{ color, fontSize: 20, fontWeight: 600 }}>{mood}</div>
            </Panel>
          );
        })}
      </div>
    );
  },
};

/**
 * The end-to-end path against a real session: free-form provider label in, mood and color out.
 *
 * Needs a project and agent with Expressive Mode enabled, configured through the storybook env
 * vars the `LiveAgentSessionProvider` decorator reads. The mood decays back to neutral a couple of
 * agent turns after the last expression, so it tracks the conversation rather than latching.
 */
export const LiveAgent: StoryObj<Args> = {
  decorators: [LiveAgentSessionProvider],
  parameters: { layout: 'centered' },
  render: (args: Args) => {
    const { microphoneTrack } = useAgent();
    const { resolvedTheme = 'dark' } = useTheme();
    const { color, mood, label } = useExpression(args);

    return (
      <div style={{ display: 'grid', gap: 24, justifyItems: 'center', padding: 32 }}>
        <AgentAudioVisualizerAura
          size="xl"
          state="speaking"
          color={color}
          audioTrack={microphoneTrack}
          themeMode={resolvedTheme as 'dark' | 'light'}
        />
        <MoodReadout color={color} mood={mood} label={label} />
      </div>
    );
  },
};
