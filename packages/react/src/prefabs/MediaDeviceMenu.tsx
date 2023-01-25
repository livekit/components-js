import { computeMenuPosition, wasClickOutside } from '@livekit/components-core';
import * as React from 'react';
import { MediaDeviceSelect } from '../components/controls/MediaDeviceSelect';
import { log } from '@livekit/components-core';

interface MediaDeviceMenuProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: MediaDeviceKind;
  initialSelection?: string;
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
export const MediaDeviceMenu = ({
  kind,
  initialSelection,
  onActiveDeviceChange,
  ...props
}: MediaDeviceMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);

  const handleActiveDeviceChange = (kind: MediaDeviceKind, deviceId: string) => {
    log.debug('handle device change');
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };

  const button = React.useRef<HTMLButtonElement>(null);
  const tooltip = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (button.current && tooltip.current && devices) {
      computeMenuPosition(button.current, tooltip.current).then(({ x, y }) => {
        if (tooltip.current) {
          Object.assign(tooltip.current.style, { left: `${x}px`, top: `${y}px` });
        }
      });
    }
  }, [button, tooltip, devices]);

  const handleClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (!tooltip.current) {
        return;
      }
      if (event.target === button.current) {
        return;
      }
      if (isOpen && wasClickOutside(tooltip.current, event)) {
        setIsOpen(false);
      }
    },
    [isOpen, tooltip, button],
  );

  React.useEffect(() => {
    document.addEventListener<'click'>('click', handleClickOutside);
    return () => {
      document.removeEventListener<'click'>('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <span style={{ position: 'relative', flexShrink: 0 }}>
      <button
        className="lk-button lk-button-menu"
        aria-pressed={isOpen}
        {...props}
        onClick={() => setIsOpen(!isOpen)}
        ref={button}
      >
        {props.children}
      </button>

      <div
        className="lk-device-menu"
        ref={tooltip}
        style={{ visibility: isOpen ? 'visible' : 'hidden' }}
      >
        {kind ? (
          <MediaDeviceSelect
            initialSelection={initialSelection}
            onActiveDeviceChange={(deviceId) => handleActiveDeviceChange(kind, deviceId)}
            onDeviceListChange={setDevices}
            kind={kind}
          />
        ) : (
          <>
            <div className="lk-device-menu-heading">Audio inputs</div>
            <MediaDeviceSelect
              kind="audioinput"
              onActiveDeviceChange={(deviceId) => handleActiveDeviceChange('audioinput', deviceId)}
              onDeviceListChange={setDevices}
            />
            <div className="lk-device-menu-heading">Video inputs</div>
            <MediaDeviceSelect
              kind="videoinput"
              onActiveDeviceChange={(deviceId) => handleActiveDeviceChange('videoinput', deviceId)}
              onDeviceListChange={setDevices}
            />
          </>
        )}
      </div>
    </span>
  );
};
