import type { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import { log } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';
import { RemoteAudioTrack } from 'livekit-client';

/** @public */
export type AudioTrackProps<T extends HTMLMediaElement = HTMLMediaElement> =
  React.HTMLAttributes<T> & {
    source: Track.Source;
    name?: string;
    participant?: Participant;
    publication?: TrackPublication;
    onSubscriptionStatusChanged?: (subscribed: boolean) => void;
    /** by the default the range is between 0 and 1 */
    volume?: number;
  };

/**
 * The AudioTrack component is responsible for rendering participant audio tracks.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * @example
 * ```tsx
 *   <ParticipantTile>
 *     <AudioTrack source={Track.Source.Microphone} />
 *   </ParticipantTile>
 * ```
 *
 * @see `ParticipantTile` component
 * @public
 */
export function AudioTrack({ onSubscriptionStatusChanged, volume, ...props }: AudioTrackProps) {
  const { source, name, publication } = props;
  const mediaEl = React.useRef<HTMLAudioElement>(null);
  const participant = useEnsureParticipant(props.participant);

  const { elementProps, isSubscribed, track } = useMediaTrackBySourceOrName(
    { source, name, participant, publication },
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
