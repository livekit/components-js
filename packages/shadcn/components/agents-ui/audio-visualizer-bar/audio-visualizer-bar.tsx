import React, { type ReactNode, useMemo } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';
import {
  type AgentState,
  type TrackReferenceOrPlaceholder,
  useMultibandTrackVolume,
} from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { cloneSingleChild } from '@/lib/clone-single-child';
import { useBarAnimator } from './hooks/useBarAnimator';

export const AudioVisualizerBarVariants = cva(
  [
    'relative flex items-center justify-center',
    '[&_>_*]:rounded-full [&_>_*]:transition-colors [&_>_*]:duration-250 [&_>_*]:ease-linear',
    '[&_>_*]:bg-transparent [&_>_*]:data-[lk-highlighted=true]:bg-current',
  ],
  {
    variants: {
      size: {
        icon: ['h-[24px] gap-[2px]', '[&_>_*]:w-[4px] [&_>_*]:min-h-[4px]'],
        sm: ['h-[56px] gap-[4px]', '[&_>_*]:w-[8px] [&_>_*]:min-h-[8px]'],
        md: ['h-[112px] gap-[8px]', '[&_>_*]:w-[16px] [&_>_*]:min-h-[16px]'],
        lg: ['h-[224px] gap-[16px]', '[&_>_*]:w-[32px] [&_>_*]:min-h-[32px]'],
        xl: ['h-[448px] gap-[32px]', '[&_>_*]:w-[64px] [&_>_*]:min-h-[64px]'],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AudioVisualizerBarProps {
  state?: AgentState;
  barCount?: number;
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder;
  className?: string;
  children?: ReactNode | ReactNode[];
}

export function AudioVisualizerBar({
  size,
  state,
  barCount,
  audioTrack,
  className,
  children,
}: AudioVisualizerBarProps & VariantProps<typeof AudioVisualizerBarVariants>) {
  const _barCount = useMemo(() => {
    if (barCount) {
      return barCount;
    }
    switch (size) {
      case 'icon':
      case 'sm':
        return 3;
      default:
        return 5;
    }
  }, [barCount, size]);

  const volumeBands = useMultibandTrackVolume(audioTrack, {
    bands: _barCount,
    loPass: 100,
    hiPass: 200,
  });

  const sequencerInterval = useMemo(() => {
    switch (state) {
      case 'connecting':
        return 2000 / _barCount;
      case 'initializing':
        return 2000;
      case 'listening':
        return 500;
      case 'thinking':
        return 150;
      default:
        return 1000;
    }
  }, [state, _barCount]);

  const highlightedIndices = useBarAnimator(state, _barCount, sequencerInterval);
  const bands = useMemo(
    () => (state === 'speaking' ? volumeBands : new Array(_barCount).fill(0)),
    [state, volumeBands, _barCount],
  );

  return (
    <div className={cn(AudioVisualizerBarVariants({ size }), className)}>
      {bands.map((band: number, idx: number) =>
        children ? (
          <React.Fragment key={idx}>
            {cloneSingleChild(children, {
              'data-lk-index': idx,
              'data-lk-highlighted': highlightedIndices.includes(idx),
              style: { height: `${band * 100}%` },
            })}
          </React.Fragment>
        ) : (
          <div
            key={idx}
            data-lk-index={idx}
            data-lk-highlighted={highlightedIndices.includes(idx)}
            style={{ height: `${band * 100}%` }}
          />
        ),
      )}
    </div>
  );
}
