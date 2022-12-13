import * as React from 'react';
import { mergeProps, useObservableState } from '../../utils';
import { setupTrackMutedIndicator } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import { useEnsureParticipant } from '../../contexts';
import { getSourceIcon } from '../../icons/util';

export interface TrackMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  source: Track.Source;
  participant?: Participant;
}

export const useTrackMutedIndicator = (
  source: Track.Source,
  participant?: Participant,
  props?: React.HtmlHTMLAttributes<HTMLDivElement>,
) => {
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
 *   <ParticipantView>
 *     <TrackMutedIndicator source={Track.Source.Camera} />
 *     <TrackMutedIndicator source={Track.Source.Microphone} />
 *   </ParticipantView>
 * {...}
 * ```
 *
 * @see `ParticipantView` component
 */
export const TrackMutedIndicator = ({
  source,
  participant,
  ...props
}: TrackMutedIndicatorProps) => {
  const { htmlProps, isMuted } = useTrackMutedIndicator(source, participant, props);

  return (
    <div {...htmlProps} data-lk-muted={isMuted}>
      {props.children ?? getSourceIcon(source, !isMuted)}
    </div>
  );
};
