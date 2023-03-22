import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import { ParticipantClickEvent, TrackReference, TrackSource } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';

type VideoTrackSource =
  | (TrackSource<Track.Source> & { trackReference?: undefined })
  | { source?: undefined; name?: undefined; trackReference: TrackReference };

export type VideoTrackProps = React.HTMLAttributes<HTMLVideoElement> &
  VideoTrackSource & {
    participant?: Participant;
    onTrackClick?: (evt: ParticipantClickEvent) => void;
    onSubscriptionStatusChanged?: (subscribed: boolean) => void;
  };

/**
 * The VideoTrack component is responsible for rendering participant video tracks like `camera` and `screen_share`.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * Children of this component are used as placeholders when the underlying (video) track is muted or not available
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantTile>
 *     <VideoTrack source={Track.Source.Camera} />
 *   </ParticipantTile>
 * {...}
 * ```
 *
 * @see `ParticipantTile` component
 */
export function VideoTrack({
  onTrackClick,
  onClick,
  onSubscriptionStatusChanged,
  name,
  source,
  trackReference,
  ...props
}: VideoTrackProps) {
  const mediaEl = React.useRef<HTMLVideoElement>(null);
  const participant = useEnsureParticipant(props.participant || trackReference?.participant);
  const { elementProps, publication, isSubscribed } = useMediaTrackBySourceOrName(
    // @ts-expect-error this is an exhaustive check for VideoTrackProps, but typescript doesn't pick it up
    source || name ? { source, name } : trackReference,
    {
      participant,
      element: mediaEl,
      props,
    },
  );

  React.useEffect(() => {
    onSubscriptionStatusChanged?.(!!isSubscribed);
  }, [isSubscribed, onSubscriptionStatusChanged]);

  const clickHandler = (evt: React.MouseEvent<HTMLVideoElement, MouseEvent>) => {
    onClick?.(evt);
    onTrackClick?.({ participant, track: publication });
  };

  return (
    <div style={{ display: 'contents' }}>
      <video ref={mediaEl} {...elementProps} muted={true} onClick={clickHandler}></video>
      {/* {!track ||
            (isMuted && <div {...elementProps}>{props.children ?? <UserSilhouetteIcon />}</div>)} */}
    </div>
  );
}
