import { Track } from 'livekit-client';
import React from 'react';
import { DeviceSelectButton } from '../controls/DeviceSelector';
import { DisconnectButton } from '../controls/DisconnectButton';
import { MediaControlButton } from '../controls/MediaControlButton';
import { StartAudio } from '../controls/StartAudio';

export function DefaultControls() {
  return (
    <div style={{ position: 'fixed', bottom: '30px' }}>
      <MediaControlButton source={Track.Source.Microphone}>Mic</MediaControlButton>
      <MediaControlButton source={Track.Source.Camera}>Cam</MediaControlButton>
      <MediaControlButton source={Track.Source.ScreenShare}>Screen</MediaControlButton>
      <DeviceSelectButton />
      <DisconnectButton>Leave</DisconnectButton>
      <StartAudio label="Start Audio" />
    </div>
  );
}
