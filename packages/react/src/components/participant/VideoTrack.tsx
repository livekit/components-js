import { RemoteTrackPublication } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import type { ParticipantClickEvent, TrackReference } from '@livekit/components-core';
import { useEnsureTrackRef } from '../../context';
import * as useHooks from 'usehooks-ts';

/** @public */
export interface VideoTrackProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /** The track reference of the track to render. */
  trackRef?: TrackReference;
  onTrackClick?: (evt: ParticipantClickEvent) => void;
  onSubscriptionStatusChanged?: (subscribed: boolean) => void;
  manageSubscription?: boolean;
}

/**
 * The `VideoTrack` component is responsible for rendering participant video tracks like `camera` and `screen_share`.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * @example
 * ```tsx
 * <VideoTrack trackRef={trackRef} />
 * ```
 * @see {@link @livekit/components-react#ParticipantTile | ParticipantTile}
 * @public
 */
export function VideoTrack({
  onTrackClick,
  onClick,
  onSubscriptionStatusChanged,
  trackRef,
  manageSubscription,
  ...props
}: VideoTrackProps) {
  const trackReference = useEnsureTrackRef(trackRef);

  const mediaEl = React.useRef<HTMLVideoElement>(null);

  const intersectionEntry = useHooks.useIntersectionObserver(mediaEl, {});

  const debouncedIntersectionEntry = useHooks.useDebounce(intersectionEntry, 3000);

  React.useEffect(() => {
    if (
      manageSubscription &&
      trackReference.publication instanceof RemoteTrackPublication &&
      debouncedIntersectionEntry?.isIntersecting === false &&
      intersectionEntry?.isIntersecting === false
    ) {
      trackReference.publication.setSubscribed(false);
    }
  }, [debouncedIntersectionEntry, trackReference, manageSubscription]);

  React.useEffect(() => {
    if (
      manageSubscription &&
      trackReference.publication instanceof RemoteTrackPublication &&
      intersectionEntry?.isIntersecting === true
    ) {
      trackReference.publication.setSubscribed(true);
    }
  }, [intersectionEntry, trackReference, manageSubscription]);

  const {
    elementProps,
    publication: pub,
    isSubscribed,
  } = useMediaTrackBySourceOrName(trackReference, {
    element: mediaEl,
    props,
  });

  React.useEffect(() => {
    onSubscriptionStatusChanged?.(!!isSubscribed);
  }, [isSubscribed, onSubscriptionStatusChanged]);

  const clickHandler = (evt: React.MouseEvent<HTMLVideoElement, MouseEvent>) => {
    onClick?.(evt);
    onTrackClick?.({ participant: trackReference?.participant, track: pub });
  };

  return <video ref={mediaEl} {...elementProps} muted={true} onClick={clickHandler}></video>;
}
