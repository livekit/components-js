import {
  RemoteTrackPublication,
  type Participant,
  type Track,
  type TrackPublication,
} from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import type { ParticipantClickEvent, TrackReference } from '@livekit/components-core';
import { useEnsureParticipant, useMaybeTrackRefContext } from '../../context';
import * as useHooks from 'usehooks-ts';

/** @public */
export interface VideoTrackProps extends React.HTMLAttributes<HTMLVideoElement> {
  /** The track reference of the track to render. */
  trackRef?: TrackReference;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  source?: Track.Source;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  name?: string;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  participant?: Participant;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  publication?: TrackPublication;
  onTrackClick?: (evt: ParticipantClickEvent) => void;
  onSubscriptionStatusChanged?: (subscribed: boolean) => void;
  manageSubscription?: boolean;
}

/**
 * The VideoTrack component is responsible for rendering participant video tracks like `camera` and `screen_share`.
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
  name,
  publication,
  source,
  participant: p,
  manageSubscription,
  ...props
}: VideoTrackProps) {
  // TODO: Remove and refactor all variables with underscore in a future version after the deprecation period.
  const maybeTrackRef = useMaybeTrackRefContext();
  const _name = trackRef?.publication?.trackName ?? maybeTrackRef?.publication?.trackName ?? name;
  const _source = trackRef?.source ?? maybeTrackRef?.source ?? source;
  const _publication = trackRef?.publication ?? maybeTrackRef?.publication ?? publication;
  const _participant = trackRef?.participant ?? maybeTrackRef?.participant ?? p;
  if (_source === undefined) {
    throw new Error('VideoTrack: You must provide a trackRef or source property.');
  }

  const participant = useEnsureParticipant(_participant);

  const mediaEl = React.useRef<HTMLVideoElement>(null);

  const intersectionEntry = useHooks.useIntersectionObserver(mediaEl, {});

  const debouncedIntersectionEntry = useHooks.useDebounce(intersectionEntry, 3000);

  React.useEffect(() => {
    if (
      manageSubscription &&
      _publication instanceof RemoteTrackPublication &&
      debouncedIntersectionEntry?.isIntersecting === false &&
      intersectionEntry?.isIntersecting === false
    ) {
      _publication.setSubscribed(false);
    }
  }, [debouncedIntersectionEntry, _publication, manageSubscription]);

  React.useEffect(() => {
    if (
      manageSubscription &&
      _publication instanceof RemoteTrackPublication &&
      intersectionEntry?.isIntersecting === true
    ) {
      _publication.setSubscribed(true);
    }
  }, [intersectionEntry, _publication, manageSubscription]);

  const {
    elementProps,
    publication: pub,
    isSubscribed,
  } = useMediaTrackBySourceOrName(
    { participant, name: _name, source: _source, publication: _publication },
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
