import { Track } from 'livekit-client';
import React, { useEffect } from 'react';
import { ConnectionQualityIndicator } from '../participant/ConnectionQualityIndicator';
import { MediaMutedIndicator } from '../participant/MediaMutedIndicator';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantProps, ParticipantView } from '../participant/Participant';
import { ParticipantName } from '../participant/ParticipantName';

export function DefaultParticipantView(props: ParticipantProps) {
  return (
    <ParticipantView {...props}>
      <MediaTrack source={props.trackSource ?? Track.Source.Camera}></MediaTrack>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex' }}>
          <MediaMutedIndicator source={Track.Source.Microphone}></MediaMutedIndicator>
          <MediaMutedIndicator source={Track.Source.Camera}></MediaMutedIndicator>
        </div>
        <ParticipantName />
        <ConnectionQualityIndicator />
      </div>
    </ParticipantView>
  );
}
