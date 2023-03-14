import { Participant } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import { AudioSource, log } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';
import { RemoteAudioTrack } from 'livekit-client';

export type AudioTrackProps<T extends HTMLMediaElement = HTMLMediaElement> =
  React.HTMLAttributes<T> &
    ({ source: AudioSource; name?: undefined } | { name: string; source?: undefined }) & {
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
  let source: AudioSource | undefined = undefined;
  let name: string | undefined = undefined;
  if (props.source !== undefined) {
    source = props.source;
  } else {
    name = props.name;
  }
  const mediaEl = React.useRef<HTMLAudioElement>(null);
  const participant = useEnsureParticipant(props.participant);
  const { elementProps, isSubscribed, track } = useMediaTrackBySourceOrName(
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

  React.useEffect(() => {
    if (volume && track instanceof RemoteAudioTrack) {
      track.setVolume(volume);
    } else {
      log.warn('volume can only be set on remote audio tracks');
    }
  }, [volume, track]);

  return <audio ref={mediaEl} {...elementProps}></audio>;
}
