import * as React from 'react';
import { mergeProps } from '../../utils';
import type { Participant, Track } from 'livekit-client';
import { getSourceIcon } from '../../assets/icons/util';
import { useTrackMutedIndicator } from '../../hooks';

/** @public */
export interface TrackMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  source: Track.Source;
  participant?: Participant;
  show?: 'always' | 'muted' | 'unmuted';
}

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
export function TrackMutedIndicator({
  source,
  participant,
  show = 'always',
  ...props
}: TrackMutedIndicatorProps) {
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
}
