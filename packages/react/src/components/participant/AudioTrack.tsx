import type { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import type { TrackReference } from '@livekit/components-core';
import { log } from '@livekit/components-core';
import { useEnsureParticipant, useMaybeTrackRefContext } from '../../context';
import { RemoteAudioTrack } from 'livekit-client';

/** @public */
export interface AudioTrackProps<T extends HTMLMediaElement = HTMLMediaElement>
  extends React.HTMLAttributes<T> {
  /** The track reference of the track from which the audio is to be rendered. */
  trackRef?: TrackReference;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  source?: Track.Source;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  name?: string;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  participant?: Participant;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  publication?: TrackPublication;
  onSubscriptionStatusChanged?: (subscribed: boolean) => void;
  /** by the default the range is between 0 and 1 */
  volume?: number;
}

/**
 * The AudioTrack component is responsible for rendering participant audio tracks.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * @example
 * ```tsx
 *   <ParticipantTile>
 *     <AudioTrack trackRef={trackRef} />
 *   </ParticipantTile>
 * ```
 *
 * @see `ParticipantTile` component
 * @public
 */
export function AudioTrack({
  trackRef,
  onSubscriptionStatusChanged,
  volume,
  source,
  name,
  publication,
  participant: p,
  ...props
}: AudioTrackProps) {
  // TODO: Remove and refactor all variables with underscore in a future version after the deprecation period.
  const maybeTrackRef = useMaybeTrackRefContext();
  const _name = trackRef?.publication?.trackName ?? maybeTrackRef?.publication?.trackName ?? name;
  const _source = trackRef?.source ?? maybeTrackRef?.source ?? source;
  const _publication = trackRef?.publication ?? maybeTrackRef?.publication ?? publication;
  const _participant = trackRef?.participant ?? maybeTrackRef?.participant ?? p;
  if (_source === undefined) {
    throw new Error('The AudioTrack component expects a trackRef or source property.');
  }

  const mediaEl = React.useRef<HTMLAudioElement>(null);
  const participant = useEnsureParticipant(_participant);

  const { elementProps, isSubscribed, track } = useMediaTrackBySourceOrName(
    { source: _source, name: _name, participant, publication: _publication },
    {
      element: mediaEl,
      props,
    },
  );

  React.useEffect(() => {
    onSubscriptionStatusChanged?.(!!isSubscribed);
  }, [isSubscribed, onSubscriptionStatusChanged]);

  React.useEffect(() => {
    if (track === undefined || volume === undefined) {
      return;
    }
    if (track instanceof RemoteAudioTrack) {
      track.setVolume(volume);
    } else {
      log.warn('volume can only be set on remote audio tracks');
    }
  }, [volume, track]);

  return <audio ref={mediaEl} {...elementProps} />;
}
