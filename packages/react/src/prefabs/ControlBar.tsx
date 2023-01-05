import { Track } from 'livekit-client';
import * as React from 'react';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { DisconnectButton } from '../components/controls/DisconnectButton';
import { TrackToggle } from '../components/controls/TrackToggle';
import { StartAudio } from '../components/controls/StartAudio';

export type ControlBarProps = React.HTMLAttributes<HTMLDivElement> & {
  variation?: 'minimal' | 'verbose' | 'textOnly';
};

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
  const { variation = 'verbose' } = props;

  const showIcon = React.useMemo(
    () => variation === 'minimal' || variation === 'verbose',
    [variation],
  );
  const showText = React.useMemo(
    () => variation === 'textOnly' || variation === 'verbose',
    [variation],
  );
  return (
    // TODO: Remove styling default styling or move to styles package.
    <div className="lk-control-bar" {...props}>
      <span>
        <TrackToggle source={Track.Source.Microphone} showIcon={showIcon}>
          {showText && 'Microphone'}
        </TrackToggle>
        <MediaDeviceMenu kind="audioinput" />
      </span>
      <span>
        <TrackToggle source={Track.Source.Camera} showIcon={showIcon}>
          {showText && 'Camera'}
        </TrackToggle>
        <MediaDeviceMenu kind="videoinput" />
      </span>
      <TrackToggle source={Track.Source.ScreenShare} showIcon={showIcon}>
        {showText && 'Share screen'}
      </TrackToggle>
      <DisconnectButton>Leave</DisconnectButton>
      <StartAudio label="Start Audio" />
    </div>
  );
}
