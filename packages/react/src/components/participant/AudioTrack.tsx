import { Participant } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import { AudioSource, log, TrackReference, TrackSource } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';
import { RemoteAudioTrack } from 'livekit-client';

type AudioTrackSource =
  | (TrackSource<AudioSource> & { trackReference?: undefined })
  | { source?: undefined; name?: undefined; trackReference: TrackReference };

export type AudioTrackProps<T extends HTMLMediaElement = HTMLMediaElement> =
  React.HTMLAttributes<T> &
    AudioTrackSource & {
      participant?: Participant;
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
 */
export function AudioTrack({ onSubscriptionStatusChanged, volume, ...props }: AudioTrackProps) {
  const { source, name, trackReference } = props;
  const mediaEl = React.useRef<HTMLAudioElement>(null);
  const participant = useEnsureParticipant(props.participant);

  const { elementProps, isSubscribed, track } = useMediaTrackBySourceOrName(
    // @ts-expect-error this is an exhaustive check for AudioTrackProps, but typescript doesn't pick it up
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

  React.useEffect(() => {
    if (volume && track instanceof RemoteAudioTrack) {
      track.setVolume(volume);
    } else {
      log.warn('volume can only be set on remote audio tracks');
    }
  }, [volume, track]);

  return <audio ref={mediaEl} {...elementProps}></audio>;
}
