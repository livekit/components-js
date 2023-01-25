import * as React from 'react';
import { MediaDeviceSelect } from '../components/controls/MediaDeviceSelect';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';

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
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };

  const button = React.useRef<HTMLButtonElement>(null);
  const tooltip = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (button.current && tooltip.current && devices) {
      computePosition(button.current, tooltip.current, {
        placement: 'top',
        middleware: [offset(6), flip(), shift({ padding: 5 })],
      }).then(({ x, y }) => {
        if (tooltip.current) {
          Object.assign(tooltip.current.style, { left: `${x}px`, top: `${y}px` });
        }
      });
    }
  }, [button, tooltip, devices]);

  function handleClickOutside(event: MouseEvent): void {
    if (!tooltip.current) {
      return;
    }
    if (tooltip.current && !tooltip.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }

  React.useEffect(() => {
    document.addEventListener('keydown', () => setIsOpen(false), true);
    document.addEventListener<'click'>('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('keydown', () => setIsOpen(false), true);
      document.removeEventListener<'click'>('click', handleClickOutside, true);
    };
  }, []);

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
