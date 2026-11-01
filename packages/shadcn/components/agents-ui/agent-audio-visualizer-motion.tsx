'use client';

import React, { type ComponentProps, type ReactNode } from 'react';
import type { AgentState } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Internal: keep visualization options off the paused DOM container. */
export function visualizerContainerProps<T extends object, K extends keyof T>(
  props: T,
  exclude: readonly K[],
): Omit<T, K> {
  const containerProps = { ...props };
  for (const key of exclude) Reflect.deleteProperty(containerProps, key);
  return containerProps;
}

export interface AgentAudioVisualizerMotionProps {
  /**
   * Pause visualization and show text state. Defaults to prefers-reduced-motion.
   * Pass the paused value from useAgentAudioVisualizerMotion to allow user playback.
   * Audio and the agent session are unaffected.
   */
  paused?: boolean;
  /** Custom paused content, for example a localized AgentAudioVisualizerState. */
  pausedContent?: ReactNode;
}

const stateLabels: Record<AgentState, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting',
  initializing: 'Initializing',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  idle: 'Idle',
  failed: 'Connection failed',
  'pre-connect-buffering': 'Preparing audio',
};

/** Text alternative for the agent state, including when animation is paused. */
export function AgentAudioVisualizerState({
  state,
  labels,
  children,
  ...props
}: ComponentProps<'span'> & { state: AgentState; labels?: Partial<Record<AgentState, string>> }) {
  return (
    <span role="status" aria-live="polite" aria-atomic="true" {...props}>
      {children ?? labels?.[state] ?? stateLabels[state]}
    </span>
  );
}

/** Place beside the visualizer or elsewhere in the app's controls. */
export function AgentAudioVisualizerToggle({
  paused,
  onPausedChange,
  playLabel = 'Play animation',
  pauseLabel = 'Pause animation',
  onClick,
  children,
  ...props
}: ComponentProps<typeof Button> & {
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
  playLabel?: string;
  pauseLabel?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPausedChange(!paused);
      }}
    >
      {children ?? (paused ? playLabel : pauseLabel)}
    </Button>
  );
}

const heights = {
  icon: 'h-[24px]',
  sm: 'h-[56px]',
  md: 'h-[112px]',
  lg: 'h-[224px]',
  xl: 'h-[448px]',
};

/** Shared paused presentation. The animation subtree is not mounted. */
export function AgentAudioVisualizerPaused({
  state,
  size = 'md',
  square = false,
  pausedContent,
  className,
  ...props
}: ComponentProps<'div'> & {
  state: AgentState;
  size?: keyof typeof heights | null;
  square?: boolean;
  pausedContent?: ReactNode;
}) {
  return (
    <div
      {...props}
      data-lk-state={state}
      data-lk-paused="true"
      className={cn(
        'flex min-w-max items-center justify-center whitespace-nowrap text-sm text-foreground',
        size && heights[size],
        square && size !== 'icon' && size !== 'sm' && 'aspect-square',
        className,
      )}
    >
      {pausedContent !== undefined ? pausedContent : <AgentAudioVisualizerState state={state} />}
    </div>
  );
}
