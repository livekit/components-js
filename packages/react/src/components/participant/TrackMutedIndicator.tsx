import * as React from 'react';
import { mergeProps } from '../../utils';
import { getSourceIcon } from '../../assets/icons/util';
import { useTrackMutedIndicator } from '../../hooks';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

/** @public */
export interface TrackMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  trackRef: TrackReferenceOrPlaceholder;
  show?: 'always' | 'muted' | 'unmuted';
}

/**
 * The `TrackMutedIndicator` shows whether the participant's camera or microphone is muted or not.
 * By default, a muted/unmuted icon is displayed for a camera, microphone, and screen sharing track.
 *
 * @example
 * ```tsx
 * <TrackMutedIndicator trackRef={trackRef} />
 * ```
 * @public
 */
export const TrackMutedIndicator: (
  props: TrackMutedIndicatorProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLDivElement, TrackMutedIndicatorProps>(
  function TrackMutedIndicator(
    { trackRef, show = 'always', ...props }: TrackMutedIndicatorProps,
    ref,
  ) {
    const { className, isMuted } = useTrackMutedIndicator(trackRef);

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
      <div ref={ref} {...htmlProps} data-lk-muted={isMuted}>
        {props.children ?? getSourceIcon(trackRef.source, !isMuted)}
      </div>
    );
  },
);
