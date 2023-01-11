import { RemoteParticipant, Track } from 'livekit-client';
import * as React from 'react';
import { MediaTrack } from './participant/MediaTrack';
import { TrackLoop } from './TrackLoop';

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
 */
export const RoomAudioRenderer = () => {
  return (
    <div style={{ display: 'none' }}>
      <TrackLoop
        sources={[Track.Source.Microphone, Track.Source.ScreenShareAudio]}
        filter={({ participant }) => {
          return participant instanceof RemoteParticipant;
        }}
      >
        {/* TODO: How to handel screen share audio? Currently it is rendered as microphone source.         */}
        <MediaTrack source={Track.Source.Microphone} />
      </TrackLoop>
    </div>
  );
};
