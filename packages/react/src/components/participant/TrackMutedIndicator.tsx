import * as React from 'react';
import { mergeProps } from '../../utils';
import { getSourceIcon } from '../../assets/icons/util';
import { useIsSpeaking, useTrackMutedIndicator } from '../../hooks';
import type { TrackReferenceOrPlaceholder } from '@cc-livekit/components-core';
import { MicDisabledMiniIcon, SpeakingDotIcon } from '../../assets/icons';

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
) => any = /* @__PURE__ */ React.forwardRef<HTMLDivElement, TrackMutedIndicatorProps>(
  function TrackMutedIndicator(
    { trackRef, show = 'always', ...props }: TrackMutedIndicatorProps,
    ref,
  ) {
    const { className, isMuted } = useTrackMutedIndicator(trackRef);
    const isSpeaking = useIsSpeaking(trackRef.participant);

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
      <div ref={ref} {...htmlProps} data-lk-muted={isMuted} data-lk-speaking={isSpeaking}>
        {/* {props.children ?? getSourceIcon(trackRef.source, !isMuted)} */}
        <ParticipantStatus isMuted={isMuted} isSpeaking={isSpeaking} />
      </div>
    );
  },
);

interface IParticipantStatusProps {
  isMuted: boolean;
  isSpeaking: boolean;
}

function ParticipantStatus(props: IParticipantStatusProps) {
  const { isSpeaking, isMuted } = props;

  if (isMuted) {
    return <MicDisabledMiniIcon />;
  }
  if (isSpeaking) {
    return (
      <div className="lk-speaking-bars">
        <div className="lk-bar-item"></div>
        <div className="lk-bar-item"></div>
        <div className="lk-bar-item"></div>
      </div>
    );
  }
  return <SpeakingDotIcon height={14} width={14} />;
}
