import * as React from 'react';
import { mergeProps, useObservableState } from '../../utils';
import { setupTrackMutedIndicator } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import { useEnsureParticipant } from '../../context';
import { getSourceIcon } from '../../assets/icons/util';

export interface TrackMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  source: Track.Source;
  participant?: Participant;
}

interface UseTrackMutedIndicatorProps {
  source: Track.Source;
  participant?: Participant;
  props?: React.HtmlHTMLAttributes<HTMLDivElement>;
}

export const useTrackMutedIndicator = ({
  source,
  participant,
  props,
}: UseTrackMutedIndicatorProps) => {
  const p = useEnsureParticipant(participant);
  const { className, mediaMutedObserver } = React.useMemo(
    () => setupTrackMutedIndicator(p, source),
    [p, source],
  );

  const htmlProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
      }),
    [className, props],
  );

  const isMuted = useObservableState(mediaMutedObserver, !!p.getTrack(source)?.isMuted, [
    mediaMutedObserver,
  ]);

  return { isMuted, htmlProps };
};

/**
 * The TrackMutedIndicator shows whether the participant's camera or microphone is muted or not.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantTile>
 *     <TrackMutedIndicator source={Track.Source.Camera} />
 *     <TrackMutedIndicator source={Track.Source.Microphone} />
 *   </ParticipantTile>
 * {...}
 * ```
 *
 * @see `ParticipantTile` component
 */
export const TrackMutedIndicator = ({
  source,
  participant,
  ...props
}: TrackMutedIndicatorProps) => {
  const { htmlProps, isMuted } = useTrackMutedIndicator({ source, participant, props });

  return (
    <div {...htmlProps} data-lk-muted={isMuted}>
      {props.children ?? getSourceIcon(source, !isMuted)}
    </div>
  );
};
