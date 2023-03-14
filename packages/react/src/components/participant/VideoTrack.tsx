import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import { ParticipantClickEvent } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';

export type VideoTrackProps = React.HTMLAttributes<HTMLVideoElement> &
  ({ source: Track.Source; name?: undefined } | { name: string; source?: undefined }) & {
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
  ...props
}: VideoTrackProps) {
  let source: Track.Source | undefined;
  let name: string | undefined;
  if (props.source !== undefined) {
    source = props.source;
  } else {
    name = props.name;
  }
  const mediaEl = React.useRef<HTMLVideoElement>(null);
  const participant = useEnsureParticipant(props.participant);
  const { elementProps, publication, isSubscribed } = useMediaTrackBySourceOrName(
    // @ts-expect-error only one of this is defined, but ts complains that both might be
    { source, name },
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
