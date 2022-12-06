import { Track } from 'livekit-client';
import * as React from 'react';
import { DeviceSelectButton } from '../components/controls/DeviceSelector';
import { DisconnectButton } from '../components/controls/DisconnectButton';
import { MediaControlButton } from '../components/controls/MediaControlButton';
import { StartAudio } from '../components/controls/StartAudio';

export type DefaultControlsProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * The DefaultControls prefab component gives the user the basic user interface
 * to control their media devices and leave the room.
 *
 * @remarks
 * This component is build with other LiveKit components like `MediaControlButton`,
 * `DeviceSelectorButton`, `DisconnectButton` and `StartAudio`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <DefaultControls />
 * </LiveKitRoom>
 * ```
 */
export function DefaultControls(props: DefaultControlsProps) {
  return (
    // TODO: Remove styling default styling or move to styles package.
    <div className="lk-controls" {...props}>
      <MediaControlButton source={Track.Source.Microphone}>Microphone</MediaControlButton>
      <MediaControlButton source={Track.Source.Camera}>Camera</MediaControlButton>
      <MediaControlButton source={Track.Source.ScreenShare}>Share screen</MediaControlButton>
      <DeviceSelectButton>Settings</DeviceSelectButton>
      <DisconnectButton>Leave</DisconnectButton>
      <StartAudio label="Start Audio" />
    </div>
  );
}
