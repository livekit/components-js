import * as React from 'react';
import { MediaDeviceSelect } from '../components/controls/MediaDeviceSelect';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
} from '@floating-ui/react';

interface MediaDeviceMenuProps extends React.HTMLAttributes<HTMLButtonElement> {
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

  const handleActiveDeviceChange = (kind: MediaDeviceKind, deviceId: string) => {
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };

  const { x, y, reference, floating, strategy, context } = useFloating({
    placement: 'top',
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });

  // Merge all the interactions into prop getters
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <span style={{ position: 'relative', flexShrink: 0 }}>
      <button
        className="lk-button lk-button-menu"
        aria-pressed={isOpen}
        {...props}
        onClick={() => setIsOpen(!isOpen)}
        ref={reference}
        {...getReferenceProps()}
      >
        {props.children}
      </button>

      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            className="lk-device-menu"
            ref={floating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
            }}
            {...getFloatingProps()}
          >
            {kind ? (
              <MediaDeviceSelect
                initialSelection={initialSelection}
                onActiveDeviceChange={(deviceId) => handleActiveDeviceChange(kind, deviceId)}
                kind={kind}
              />
            ) : (
              <>
                <div className="lk-device-menu-heading">Audio inputs</div>
                <MediaDeviceSelect
                  kind="audioinput"
                  onActiveDeviceChange={(deviceId) =>
                    handleActiveDeviceChange('audioinput', deviceId)
                  }
                ></MediaDeviceSelect>
                <div className="lk-device-menu-heading">Video inputs</div>
                <MediaDeviceSelect
                  kind="videoinput"
                  onActiveDeviceChange={(deviceId) =>
                    handleActiveDeviceChange('videoinput', deviceId)
                  }
                ></MediaDeviceSelect>
              </>
            )}
          </div>
        </FloatingFocusManager>
      )}
    </span>
  );
};
