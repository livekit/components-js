import { Track } from 'livekit-client';
import * as React from 'react';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { DisconnectButton } from '../components/controls/DisconnectButton';
import { TrackToggle } from '../components/controls/TrackToggle';
import { StartAudio } from '../components/controls/StartAudio';
import { ChatIcon, LeaveIcon } from '../assets/icons';
import { ChatToggle } from '../components/controls/ChatToggle';

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
  chat: false,
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
    <div className="lk-control-bar" {...props}>
      {visibleControls.microphone && (
        <div className="lk-button-group">
          <TrackToggle source={Track.Source.Microphone} showIcon={showIcon}>
            <span>{showText && 'Microphone'}</span>
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu kind="audioinput" />
          </div>
        </div>
      )}
      {visibleControls.camera && (
        <div className="lk-button-group">
          <TrackToggle source={Track.Source.Camera} showIcon={showIcon}>
            <span>{showText && 'Camera'}</span>
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
          <span>{showText && (isScreenShareEnabled ? 'Stop screen share' : 'Share screen')}</span>
        </TrackToggle>
      )}
      {visibleControls.chat && (
        <ChatToggle>
          {showIcon && <ChatIcon />}
          <span>{showText && 'Chat'}</span>
        </ChatToggle>
      )}
      {visibleControls.leave && (
        <DisconnectButton>
          {showIcon && <LeaveIcon />}
          <span>{showText && 'Leave'}</span>
        </DisconnectButton>
      )}
      <StartAudio label="Start Audio" />
    </div>
  );
}
