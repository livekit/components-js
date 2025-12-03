'use client';

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { Track } from 'livekit-client';
import { useTrackToggle } from '@livekit/components-react';
import {
  MicIcon,
  MicOffIcon,
  MonitorUpIcon,
  MonitorOffIcon,
  LoaderIcon,
  VideoIcon,
  VideoOffIcon,
} from 'lucide-react';
import { Toggle, toggleVariants } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

export const agentTrackToggleVariants = cva(['size-9'], {
  variants: {
    variant: {
      primary:
        'bg-muted data-[state=on]:bg-muted text-destructive hover:text-foreground hover:bg-foreground/10 hover:data-[state=on]:bg-foreground/10',
      secondary: [
        'bg-muted hover:bg-foreground/10',
        'data-[state=on]:bg-blue-500/20 data-[state=on]:hover:bg-blue-500/30 data-[state=on]:text-blue-700',
        'dark:data-[state=on]:text-blue-300',
      ],
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

function getSourceIcon(source: Track.Source, enabled: boolean, pending = false) {
  if (pending) {
    return LoaderIcon;
  }

  switch (source) {
    case Track.Source.Microphone:
      return enabled ? MicIcon : MicOffIcon;
    case Track.Source.Camera:
      return enabled ? VideoIcon : VideoOffIcon;
    case Track.Source.ScreenShare:
      return enabled ? MonitorUpIcon : MonitorOffIcon;
    default:
      return React.Fragment;
  }
}

export type AgentTrackToggleProps = Omit<React.ComponentProps<typeof Toggle>, 'size' | 'variant'> &
  VariantProps<typeof agentTrackToggleVariants> & {
    source: Parameters<typeof useTrackToggle>[0]['source'];
    pending?: boolean;
    variant?: VariantProps<typeof toggleVariants>['variant'];
  };

export function AgentTrackToggle({
  source,
  pressed,
  variant,
  pending,
  className,
  ...props
}: AgentTrackToggleProps) {
  const IconComponent = getSourceIcon(source, pressed ?? false, pending);

  return (
    <Toggle
      variant={variant}
      pressed={pressed ?? false}
      aria-label={`Toggle ${source}`}
      className={cn(
        agentTrackToggleVariants({
          variant: source === Track.Source.ScreenShare ? 'secondary' : 'primary',
          className,
        }),
      )}
      {...props}
    >
      <IconComponent className={cn(pending && 'animate-spin')} />
      {props.children}
    </Toggle>
  );
}
