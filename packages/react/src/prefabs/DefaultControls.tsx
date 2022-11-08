import { Track } from 'livekit-client';
import * as React from 'react';
import { DeviceSelectButton } from '../components/controls/DeviceSelector';
import { DisconnectButton } from '../components/controls/DisconnectButton';
import { MediaControlButton } from '../components/controls/MediaControlButton';
import { StartAudio } from '../components/controls/StartAudio';

export interface DefaultControlsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DefaultControls(props: DefaultControlsProps) {
  return (
    // TODO: Remove styling default styling or move to styles package.
    <div style={{ position: 'fixed', bottom: '30px' }} {...props}>
      <MediaControlButton source={Track.Source.Microphone}>Mic</MediaControlButton>
      <MediaControlButton source={Track.Source.Camera}>Cam</MediaControlButton>
      <MediaControlButton source={Track.Source.ScreenShare}>Screen</MediaControlButton>
      <DeviceSelectButton />
      <DisconnectButton>Leave</DisconnectButton>
      <StartAudio label="Start Audio" />
    </div>
  );
}
