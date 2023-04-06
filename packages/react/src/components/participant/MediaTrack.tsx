import type { Participant, TrackPublication } from 'livekit-client';
import {
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
} from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useMediaTrackBySourceOrName } from '../../hooks/useMediaTrackBySourceOrName';
import type { ParticipantClickEvent } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';
import type { TrackInfo } from 'livekit-client/dist/src/proto/livekit_models';

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
    onDebugInfo?: (stats: DebugTrackInfo) => void;
  };

export type DebugTrackInfo = {
  info?: TrackInfo;
  stats?: Map<string, Record<string, unknown>>;
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
  onDebugInfo,
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

  React.useEffect(() => {
    const updateStats = async () => {
      if (onDebugInfo && pub) {
        const track = pub.track;
        let stats: RTCStatsReport | undefined;
        const readableStats: Map<string, Record<string, unknown>> = new Map();

        if (track instanceof LocalAudioTrack || track instanceof LocalVideoTrack) {
          stats = await track.sender?.getStats();
          console.log(
            'local stats',
            stats?.forEach((val) => {
              if (val.type === 'outbound-rtp') {
                readableStats.set(val['rid'], val);
              }
            }),
          );
        } else if (track instanceof RemoteVideoTrack || track instanceof RemoteAudioTrack) {
          stats = await track.receiver?.getStats();
          console.log(
            'local stats',
            stats?.forEach((val) => {
              if (val.type === 'inbound-rtp') {
                readableStats.set(val['trackIdentifier'], val);
              }
            }),
          );
        }
        const debugInfo = {
          stats: readableStats,
          info: pub.trackInfo,
        } satisfies DebugTrackInfo;
        onDebugInfo(debugInfo);
      }
    };
    updateStats();
    const statsInterval = setInterval(() => updateStats(), 2000);
    return () => {
      clearInterval(statsInterval);
    };
  }, [onDebugInfo, pub]);

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
