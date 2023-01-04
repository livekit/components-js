import { Track } from 'livekit-client';
import * as React from 'react';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { DisconnectButton } from '../components/controls/DisconnectButton';
import { TrackToggle } from '../components/controls/TrackToggle';
import { StartAudio } from '../components/controls/StartAudio';
import { MediaDeviceSelect } from '../components/controls/MediaDeviceSelect';

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
      <span>
        <TrackToggle source={Track.Source.Microphone}>Microphone</TrackToggle>
        <MediaDeviceMenu kind="audioinput" />
      </span>
      <span>
        <TrackToggle source={Track.Source.Camera}>Camera</TrackToggle>
        <MediaDeviceMenu kind="videoinput" />
      </span>
      <TrackToggle source={Track.Source.ScreenShare}>Share screen</TrackToggle>
      <DisconnectButton>Leave</DisconnectButton>
      <StartAudio label="Start Audio" />
    </div>
  );
}
