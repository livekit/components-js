import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMediaTrack } from '../../hooks';
import { ParticipantClickEvent } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';

export interface MediaTrackProps<T extends HTMLMediaElement = HTMLMediaElement>
  extends React.HTMLAttributes<T> {
  source: Track.Source;
  participant?: Participant;
  onTrackClick?: (evt: ParticipantClickEvent) => void;
  onSubscriptionStatusChanged?: (subscribed: boolean) => void;
}

/**
 * The MediaTrack component is responsible for rendering participant media tracks like `camera`, `microphone` and `screen_share`.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * Children of this component are used as placeholders when the underlying (video) track is muted or not available
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantTile>
 *     <MediaTrack source={Track.Source.Camera} />
 *     <MediaTrack source={Track.Source.Microphone} />
 *   </ParticipantTile>
 * {...}
 * ```
 *
 * @see `ParticipantTile` component
 */
export function MediaTrack({
  onTrackClick,
  onClick,
  onSubscriptionStatusChanged,
  ...props
}: MediaTrackProps) {
  const mediaEl = React.useRef<HTMLVideoElement>(null);
  const participant = useEnsureParticipant(props.participant);
  const { elementProps, publication, isSubscribed } = useMediaTrack(props.source, {
    participant,
    element: mediaEl,
    props,
  });

  React.useEffect(() => {
    onSubscriptionStatusChanged?.(!!isSubscribed);
  }, [isSubscribed, onSubscriptionStatusChanged]);

  const clickHandler = (evt: React.MouseEvent<HTMLMediaElement, MouseEvent>) => {
    onClick?.(evt);
    onTrackClick?.({ participant, track: publication });
  };

  return (
    <div style={{ display: 'contents' }}>
      {props.source === Track.Source.Camera || props.source === Track.Source.ScreenShare ? (
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
