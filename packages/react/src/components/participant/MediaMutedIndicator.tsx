import React, { HTMLAttributes, HtmlHTMLAttributes, useEffect, useMemo, useState } from 'react';
import { mergeProps, useObservableState } from '../../utils';
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

  const isMuted = useObservableState(mediaMutedObserver, !!p.getTrack(source)?.isMuted, [
    mediaMutedObserver,
  ]);

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
