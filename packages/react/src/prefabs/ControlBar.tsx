import { Track } from 'livekit-client';
import * as React from 'react';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { DisconnectButton } from '../components/controls/DisconnectButton';
import { TrackToggle } from '../components/controls/TrackToggle';
import { StartAudio } from '../components/controls/StartAudio';
import { LeaveIcon } from '../icons';

type ControlBarControls = {
  microphone?: boolean;
  camera?: boolean;
  chat?: boolean;
  screenShare?: boolean;
  leave?: boolean;
};

const defaultControls: ControlBarControls = {
  microphone: true,
  camera: true,
  chat: true,
  screenShare: true,
  leave: true,
} as const;

export type ControlBarProps = React.HTMLAttributes<HTMLDivElement> & {
  variation?: 'minimal' | 'verbose' | 'textOnly';
  controls?: ControlBarControls;
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
  const { variation = 'verbose', controls } = props;

  const visibleControls = { ...defaultControls, ...controls };

  const showIcon = React.useMemo(
    () => variation === 'minimal' || variation === 'verbose',
    [variation],
  );
  const showText = React.useMemo(
    () => variation === 'textOnly' || variation === 'verbose',
    [variation],
  );

  const [isScreenShareEnabled, setIsScreenShareEnabled] = React.useState(false);

  const onScreenShareChange = (enabled: boolean) => {
    setIsScreenShareEnabled(enabled);
  };

  return (
    // TODO: Remove styling default styling or move to styles package.
    <div className="lk-control-bar" {...props}>
      {visibleControls.microphone && (
        <div className="lk-button-group">
          <TrackToggle source={Track.Source.Microphone} showIcon={showIcon}>
            {showText && 'Microphone'}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu kind="audioinput" />
          </div>
        </div>
      )}
      {visibleControls.camera && (
        <div className="lk-button-group">
          <TrackToggle source={Track.Source.Camera} showIcon={showIcon}>
            {showText && 'Camera'}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu kind="videoinput" />
          </div>
        </div>
      )}
      {visibleControls.screenShare && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          showIcon={showIcon}
          onChange={onScreenShareChange}
        >
          {showText && (isScreenShareEnabled ? 'Stop screen share' : 'Share screen')}
        </TrackToggle>
      )}
      {visibleControls.leave && (
        <DisconnectButton>
          {showIcon && <LeaveIcon />}
          {showText && 'Leave'}
        </DisconnectButton>
      )}
      <StartAudio label="Start Audio" />
    </div>
  );
}
