import { RemoteParticipant, Track } from 'livekit-client';
import React from 'react';
import { AudioTrack } from './participant/AudioTrack';
import { Participants } from './Participants';

export const RoomAudioRenderer = () => {
  return (
    <Participants
      filter={(participants) => participants.filter((p) => p instanceof RemoteParticipant)}
    >
      <AudioTrack source={Track.Source.Microphone} />
    </Participants>
  );
};
