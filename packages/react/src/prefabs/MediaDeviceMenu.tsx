import * as React from 'react';
import { MediaDeviceSelect } from '../components/controls/MediaDeviceSelect';

interface MediaDeviceMenuProps extends React.HTMLAttributes<HTMLButtonElement> {
  kind?: MediaDeviceKind;
  onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
}

/**
 * The MediaDeviceMenu prefab component is a button that opens a menu that lists
 * all media devices and allows the user to select them.
 *
 * @remarks
 * This component is implemented with the `MediaDeviceSelect` LiveKit components.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceMenu />
 * </LiveKitRoom>
 * ```
 */
export const MediaDeviceMenu = ({ kind, onActiveDeviceChange, ...props }: MediaDeviceMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleActiveDeviceChange = (kind: MediaDeviceKind, deviceId: string) => {
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };
  return (
    <span style={{ position: 'relative', flexShrink: 0 }}>
      <button
        className="lk-button lk-button-menu"
        aria-pressed={isOpen}
        {...props}
        onClick={() => setIsOpen(!isOpen)}
      >
        {props.children}
      </button>

      <div
        className="lk-device-menu"
        style={{
          display: isOpen ? 'block' : 'none',
        }}
      >
        {kind ? (
          <MediaDeviceSelect
            onActiveDeviceChange={(deviceId) => handleActiveDeviceChange(kind, deviceId)}
            kind={kind}
          />
        ) : (
          <>
            <div className="lk-device-menu-heading">Audio inputs</div>
            <MediaDeviceSelect
              kind="audioinput"
              onActiveDeviceChange={(deviceId) => handleActiveDeviceChange('audioinput', deviceId)}
            ></MediaDeviceSelect>
            <div className="lk-device-menu-heading">Video inputs</div>
            <MediaDeviceSelect
              kind="videoinput"
              onActiveDeviceChange={(deviceId) => handleActiveDeviceChange('videoinput', deviceId)}
            ></MediaDeviceSelect>
          </>
        )}
      </div>
    </span>
  );
};
