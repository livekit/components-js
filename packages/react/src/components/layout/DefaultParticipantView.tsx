import { Track } from 'livekit-client';
import React, { useEffect } from 'react';
import { ConnectionQualityIndicator } from '../participant/ConnectionQualityIndicator';
import { MediaMutedIndicator } from '../participant/MediaMutedIndicator';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantProps, ParticipantView } from '../participant/Participant';
import { ParticipantName } from '../participant/ParticipantName';

export function DefaultParticipantView(props: ParticipantProps) {
  useEffect(() => {
    console.log('default view detected participant change', props.participant?.identity);
  }, [props.participant]);
  return (
    <ParticipantView {...props}>
      <MediaTrack source={props.trackSource ?? Track.Source.Camera}></MediaTrack>
      <div>
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
