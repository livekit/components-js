import { getTrackReferenceId, isLocal } from '@livekit/components-core';
import type { RemoteTrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useTracks } from '../hooks';
import { AudioTrack } from './participant/AudioTrack';

/** @public */
export interface RoomAudioRendererProps {
  /** Sets the volume for all audio tracks rendered by this component. By default, the range is between `0.0` and `1.0`. */
  volume?: number;
  /**
   * If set to `true`, mutes all audio tracks rendered by the component.
   * @remarks
   * If set to `true`, the server will stop sending audio track data to the client.
   * @alpha
   */
  muted?: boolean;
}

/**
 * The `RoomAudioRenderer` component is a drop-in solution for adding audio to your LiveKit app.
 * It takes care of handling remote participants’ audio tracks and makes sure that microphones and screen share are audible.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <RoomAudioRenderer />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function RoomAudioRenderer({ volume, muted }: RoomAudioRendererProps) {
  const tracks = useTracks(
    [Track.Source.Microphone, Track.Source.ScreenShareAudio, Track.Source.Unknown],
    {
      updateOnlyOn: [],
      onlySubscribed: false,
    },
  ).filter((ref) => !isLocal(ref.participant) && ref.publication.kind === Track.Kind.Audio);

  React.useEffect(() => {
    for (const track of tracks) {
      (track.publication as RemoteTrackPublication).setSubscribed(true);
    }
  }, [tracks]);

  return (
    <div style={{ display: 'none' }}>
      {tracks.map((trackRef) => (
        <AudioTrack
          key={getTrackReferenceId(trackRef)}
          trackRef={trackRef}
          volume={volume}
          muted={muted}
        />
      ))}
    </div>
  );
}
