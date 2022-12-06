import { RemoteParticipant, Track } from 'livekit-client';
import React from 'react';
import { MediaTrack } from './participant/MediaTrack';
import { ParticipantsLoop } from './ParticipantsLoop';

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
    <ParticipantsLoop
      filter={(participants) => participants.filter((p) => p instanceof RemoteParticipant)}
    >
      <div style={{ display: 'hidden' }}>
        <MediaTrack source={Track.Source.Microphone} />
        <MediaTrack source={Track.Source.ScreenShareAudio} />
      </div>
    </ParticipantsLoop>
  );
};
