import { getTrackReferenceId, isLocal } from '@livekit/components-core';
import type { RemoteTrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useTracks } from '../hooks';
import { AudioTrack } from './participant/AudioTrack';

/**
 * The RoomAudioRenderer component is a drop-in solution for adding audio to your LiveKit app.
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
export function RoomAudioRenderer() {
  const tracks = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio], {
    updateOnlyOn: [],
    onlySubscribed: false,
  }).filter((ref) => !isLocal(ref.participant));

  React.useEffect(() => {
    tracks.forEach((track) => (track.publication as RemoteTrackPublication).setSubscribed(true));
  }, [tracks]);

  return (
    <div style={{ display: 'none' }}>
      {tracks.map((trackRef) => (
        <AudioTrack key={getTrackReferenceId(trackRef)} trackRef={trackRef} />
      ))}
    </div>
  );
}
