import * as React from 'react';
import { mergeProps, useObservableState } from '../../utils';
import { setupMediaMutedIndicator } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import { useEnsureParticipant } from '../../contexts';

export interface MediaMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  source: Track.Source;
  participant?: Participant;
}

export const useMediaMutedIndicator = (
  source: Track.Source,
  participant?: Participant,
  props?: React.HtmlHTMLAttributes<HTMLDivElement>,
) => {
  const p = useEnsureParticipant(participant);
  const { className, mediaMutedObserver } = React.useMemo(
    () => setupMediaMutedIndicator(p, source),
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
 * The MediaMutedIndicator shows whether the participant's camera or microphone is muted or not.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantView>
 *     <MediaMutedIndicator source={Track.Source.Camera} />
 *     <MediaMutedIndicator source={Track.Source.Microphone} />
 *   </ParticipantView>
 * {...}
 * ```
 *
 * @see `ParticipantView` component
 */
export const MediaMutedIndicator = ({
  source,
  participant,
  ...props
}: MediaMutedIndicatorProps) => {
  const { htmlProps, isMuted } = useMediaMutedIndicator(source, participant, props);

  return (
    <div {...htmlProps} data-lk-muted={isMuted}>
      {props.children}
    </div>
  );
};
