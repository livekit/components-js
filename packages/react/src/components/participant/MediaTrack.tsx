import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import { ParticipantClickEvent } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';

/**
 * @deprecated Use `AudioTrack` or `VideoTrack` instead
 */
export type MediaTrackProps<T extends HTMLMediaElement = HTMLMediaElement> =
  React.HTMLAttributes<T> &
    ({ source: Track.Source } | { name: string; kind: Track.Kind }) & {
      participant?: Participant;
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
  ...props
}: MediaTrackProps) {
  let source: Track.Source | undefined;
  let kind: Track.Kind | undefined;
  let name: string | undefined;
  if ('source' in props) {
    source = props.source;
  } else {
    kind = props.kind;
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

  const clickHandler = (evt: React.MouseEvent<HTMLMediaElement, MouseEvent>) => {
    onClick?.(evt);
    onTrackClick?.({ participant, track: publication });
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
