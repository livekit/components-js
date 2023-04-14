import * as React from 'react';
import { mergeProps } from '../../utils';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { setupTrackMutedIndicator, trackReference } from '@livekit/components-core';
import type { Participant, Track } from 'livekit-client';
import { useEnsureTrackReference } from '../../context';
import { getSourceIcon } from '../../assets/icons/util';
import { useObservableState } from '../../hooks/internal/useObservableState';

export interface TrackMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  source: Track.Source;
  participant?: Participant;
  show?: 'always' | 'muted' | 'unmuted';
}

export const useTrackMutedIndicator = (maybeTrackRef?: TrackReferenceOrPlaceholder) => {
  const trackRef = useEnsureTrackReference(maybeTrackRef);
  const { className, mediaMutedObserver } = React.useMemo(
    () => setupTrackMutedIndicator(trackRef.participant, trackRef.source),
    [trackRef.participant, trackRef.source],
  );

  const isMuted = useObservableState(
    mediaMutedObserver,
    !!trackRef.participant.getTrack(trackRef.source)?.isMuted,
  );

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
 */
export const TrackMutedIndicator = ({
  source,
  participant,
  show = 'always',
  ...props
}: TrackMutedIndicatorProps) => {
  const maybeTrackRef = participant ? trackReference(participant, source) : undefined;
  const { className, isMuted } = useTrackMutedIndicator(maybeTrackRef);

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
