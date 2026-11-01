import React from 'react';
import { AgentAudioVisualizerToggle, useAgentAudioVisualizerMotion } from '@livekit/agents-ui';

/** Shared example controls; each visualizer keeps its story in its existing file. */
export function ReducedMotionVisualizer({
  children,
}: {
  children: (paused: boolean) => React.ReactNode;
}) {
  const { prefersReducedMotion, paused, setPaused } = useAgentAudioVisualizerMotion();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-4">
      {!prefersReducedMotion && (
        <p className="text-sm text-muted-foreground">
          Enable prefers-reduced-motion: reduce in your browser's developer tools, or turn on Reduce
          Motion in your system settings, to try the reduced-motion experience.
        </p>
      )}
      <div className="flex min-h-64 min-w-64 items-center justify-center">{children(paused)}</div>
      <AgentAudioVisualizerToggle paused={paused} onPausedChange={setPaused} />
      <p className="text-sm text-muted-foreground">
        This control pauses only the animation. Audio continues normally.
      </p>
    </div>
  );
}
