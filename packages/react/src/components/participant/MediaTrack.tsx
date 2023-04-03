import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import type { ParticipantClickEvent } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';

/**
 * @deprecated Use `AudioTrack` or `VideoTrack` instead
 */
export type MediaTrackProps<T extends HTMLMediaElement = HTMLMediaElement> =
  React.HTMLAttributes<T> & {
    source: Track.Source;
    name?: string;
    participant?: Participant;
    publication?: TrackPublication;
    onTrackClick?: (evt: ParticipantClickEvent) => void;
    onSubscriptionStatusChanged?: (subscribed: boolean) => void;
  };

/**
 * @deprecated This component will be removed in the next version. Use `AudioTrack` or `VideoTrack` instead
 */
export function MediaTrack({
  onTrackClick,
  onClick,
  onSubscriptionStatusChanged,
  source,
  name,
  participant,
  publication,
  ...props
}: MediaTrackProps) {
  const mediaEl = React.useRef<HTMLVideoElement>(null);
  const p = useEnsureParticipant(participant);
  const kind =
    source === Track.Source.Camera || source == Track.Source.ScreenShare ? 'video' : 'audio';
  const {
    elementProps,
    publication: pub,
    isSubscribed,
  } = useMediaTrackBySourceOrName(
    {
      name,
      source,
      participant: p,
      publication,
    },
    { element: mediaEl, props },
  );

  React.useEffect(() => {
    onSubscriptionStatusChanged?.(!!isSubscribed);
  }, [isSubscribed, onSubscriptionStatusChanged]);

  const clickHandler = (evt: React.MouseEvent<HTMLMediaElement, MouseEvent>) => {
    onClick?.(evt);
    onTrackClick?.({ participant: p, track: pub });
  };

  return (
    <div style={{ display: 'contents' }}>
      {source === Track.Source.Camera ||
      source === Track.Source.ScreenShare ||
      kind === Track.Kind.Video ? (
        <>
          <video ref={mediaEl} {...elementProps} muted={true} onClick={clickHandler}></video>
          {/* {!track ||
            (isMuted && <div {...elementProps}>{props.children ?? <UserSilhouetteIcon />}</div>)} */}
        </>
      ) : (
        <audio ref={mediaEl} {...elementProps}></audio>
      )}
    </div>
  );
}
