import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../../contexts';
import { useMediaTrack } from '../../hooks';
import { UserSilhouetteIcon } from '../../icons';
import { ParticipantClickEvent } from './ParticipantTile';

export interface MediaTrackProps<T extends HTMLMediaElement = HTMLMediaElement>
  extends React.HTMLAttributes<T> {
  participant?: Participant;
  source: Track.Source;
  onTrackClick?: (evt: ParticipantClickEvent) => void;
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
export function MediaTrack({ onTrackClick, onClick, ...props }: MediaTrackProps) {
  const participant = useEnsureParticipant(props.participant);

  const mediaEl = React.useRef<HTMLVideoElement>(null);
  const { elementProps, publication, track, isMuted } = useMediaTrack({
    participant,
    source: props.source,
    element: mediaEl,
    props,
  });

  const clickHandler = (evt: React.MouseEvent<HTMLMediaElement, MouseEvent>) => {
    onClick?.(evt);
    onTrackClick?.({ participant, publication });
  };

  return (
    <>
      {props.source === Track.Source.Camera || props.source === Track.Source.ScreenShare ? (
        !track || isMuted ? (
          <div {...elementProps}>
            {props.children ?? (
              <UserSilhouetteIcon
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
        ) : (
          <video ref={mediaEl} {...elementProps} muted={true} onClick={clickHandler}></video>
        )
      ) : (
        <audio ref={mediaEl} {...elementProps}></audio>
      )}
    </>
  );
}
