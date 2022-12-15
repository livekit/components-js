import { Track } from 'livekit-client';
import * as React from 'react';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { DisconnectButton } from '../components/controls/DisconnectButton';
import { TrackToggle } from '../components/controls/TrackToggle';
import { StartAudio } from '../components/controls/StartAudio';

export type ControlBarProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * The ControlBar prefab component gives the user the basic user interface
 * to control their media devices and leave the room.
 *
 * @remarks
 * This component is build with other LiveKit components like `TrackToggle`,
 * `DeviceSelectorButton`, `DisconnectButton` and `StartAudio`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ControlBar />
 * </LiveKitRoom>
 * ```
 */
export function ControlBar(props: ControlBarProps) {
  return (
    // TODO: Remove styling default styling or move to styles package.
    <div className="lk-control-bar" {...props}>
      <TrackToggle source={Track.Source.Microphone}>Microphone</TrackToggle>
      <TrackToggle source={Track.Source.Camera}>Camera</TrackToggle>
      <TrackToggle source={Track.Source.ScreenShare}>Share screen</TrackToggle>
      <MediaDeviceMenu>Settings</MediaDeviceMenu>
      <DisconnectButton>Leave</DisconnectButton>
      <StartAudio label="Start Audio" />
    </div>
  );
}
