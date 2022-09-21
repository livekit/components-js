import { RemoteParticipant, Track } from 'livekit-client';
import React from 'react';
import { MediaTrack } from './participant/MediaTrack';
import { Participants } from './Participants';

export const RoomAudioRenderer = () => {
  return (
    <Participants
      filter={(participants) => participants.filter((p) => p instanceof RemoteParticipant)}
    >
      <div style={{ display: 'hidden' }}>
        <MediaTrack source={Track.Source.Microphone} />
        <MediaTrack source={Track.Source.ScreenShareAudio} />
      </div>
    </Participants>
  );
};
