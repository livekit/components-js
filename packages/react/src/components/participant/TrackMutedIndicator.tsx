import * as React from 'react';
import { mergeProps } from '../../utils';
import { setupTrackMutedIndicator } from '@livekit/components-core';
import type { Participant, Track } from 'livekit-client';
import { useEnsureParticipant } from '../../context';
import { getSourceIcon } from '../../assets/icons/util';
import { useObservableState } from '../../hooks/internal/useObservableState';

/** @public */
export interface TrackMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  source: Track.Source;
  participant?: Participant;
  show?: 'always' | 'muted' | 'unmuted';
}

/** @public */
export interface UseTrackMutedIndicatorOptions {
  participant?: Participant;
}

/** @public */
export const useTrackMutedIndicator = (
  source: Track.Source,
  options: UseTrackMutedIndicatorOptions = {},
) => {
  const p = useEnsureParticipant(options.participant);
  const { className, mediaMutedObserver } = React.useMemo(
    () => setupTrackMutedIndicator(p, source),
    [p, source],
  );

  const isMuted = useObservableState(mediaMutedObserver, !!p.getTrack(source)?.isMuted);

  return { isMuted, className };
};

/**
 * The TrackMutedIndicator shows whether the participant's camera or microphone is muted or not.
 *
 * @example
 * ```tsx
 * <TrackMutedIndicator source={Track.Source.Camera} />
 * <TrackMutedIndicator source={Track.Source.Microphone} />
 * ```
 * @public
 */
export const TrackMutedIndicator = ({
  source,
  participant,
  show = 'always',
  ...props
}: TrackMutedIndicatorProps) => {
  const { className, isMuted } = useTrackMutedIndicator(source, { participant });

  const showIndicator =
    show === 'always' || (show === 'muted' && isMuted) || (show === 'unmuted' && !isMuted);

  const htmlProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
      }),
    [className, props],
  );

  if (!showIndicator) {
    return null;
  }

  return (
    <div {...htmlProps} data-lk-muted={isMuted}>
      {props.children ?? getSourceIcon(source, !isMuted)}
    </div>
  );
};
