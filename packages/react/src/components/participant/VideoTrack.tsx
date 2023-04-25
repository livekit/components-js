import type { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import type { ParticipantClickEvent } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';

/** @public */
export type VideoTrackProps = React.HTMLAttributes<HTMLVideoElement> & {
  source: Track.Source;
  name?: string;
  participant?: Participant;
  publication?: TrackPublication;
  onTrackClick?: (evt: ParticipantClickEvent) => void;
  onSubscriptionStatusChanged?: (subscribed: boolean) => void;
};

/**
 * The VideoTrack component is responsible for rendering participant video tracks like `camera` and `screen_share`.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * @example
 * ```tsx
 * <VideoTrack source={Track.Source.Camera} />
 * ```
 * @see {@link @livekit/components-react#ParticipantTile | ParticipantTile}
 * @public
 */
export function VideoTrack({
  onTrackClick,
  onClick,
  onSubscriptionStatusChanged,
  name,
  publication,
  source,
  ...props
}: VideoTrackProps) {
  const mediaEl = React.useRef<HTMLVideoElement>(null);
  const participant = useEnsureParticipant(props.participant);
  const {
    elementProps,
    publication: pub,
    isSubscribed,
  } = useMediaTrackBySourceOrName(
    { participant, name, source, publication },
    {
      element: mediaEl,
      props,
    },
  );

  React.useEffect(() => {
    onSubscriptionStatusChanged?.(!!isSubscribed);
  }, [isSubscribed, onSubscriptionStatusChanged]);

  const clickHandler = (evt: React.MouseEvent<HTMLVideoElement, MouseEvent>) => {
    onClick?.(evt);
    onTrackClick?.({ participant, track: pub });
  };

  return <video ref={mediaEl} {...elementProps} muted={true} onClick={clickHandler}></video>;
}
