import * as React from 'react';
import { mergeProps } from '../../utils';
import type { Participant, Track } from 'livekit-client';
import { getSourceIcon } from '../../assets/icons/util';
import { useTrackMutedIndicator } from '../../hooks';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

/** @public */
export interface TrackMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  source?: Track.Source;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  participant?: Participant;
  trackRef?: TrackReferenceOrPlaceholder;
  show?: 'always' | 'muted' | 'unmuted';
}

/**
 * The `TrackMutedIndicator` shows whether the participant's camera or microphone is muted or not.
 * By default, a muted/unmuted icon is displayed for a camera, microphone, and screen sharing track.
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
  trackRef,
  show = 'always',
  ...props
}: TrackMutedIndicatorProps) {
  // @ts-ignore this should work
  const { className, isMuted } = useTrackMutedIndicator(trackRef ?? source, { participant });

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
      {props.children ?? getSourceIcon((trackRef?.source ?? source)!, !isMuted)}
    </div>
  );
}
