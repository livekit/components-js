import React, { HTMLAttributes, HtmlHTMLAttributes, useEffect, useMemo, useState } from 'react';
import { mergeProps } from '../../utils';
import { setupMediaMutedIndicator } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import { useParticipantContext } from '../../contexts';

interface MediaMutedIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  source: Track.Source;
  participant?: Participant;
}

export const useMediaMutedIndicator = (
  source: Track.Source,
  participant?: Participant,
  props?: HtmlHTMLAttributes<HTMLDivElement>,
) => {
  const p = participant ?? useParticipantContext();
  const [isMuted, setIsMuted] = useState(p.getTrack(source)?.isMuted);
  const { className, mediaMutedObserver } = useMemo(
    () => setupMediaMutedIndicator(p, source),
    [source, participant],
  );

  const htmlProps = useMemo(
    () =>
      mergeProps(props, {
        className,
      }),
    [className, props],
  );

  useEffect(() => {
    const subscriber = mediaMutedObserver.subscribe(setIsMuted);
    return () => subscriber.unsubscribe();
  });

  return { isMuted, htmlProps };
};

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
