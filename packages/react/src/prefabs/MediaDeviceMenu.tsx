import { computeMenuPosition, wasClickOutside, log } from '@livekit/components-core';
import * as React from 'react';
import { MediaDeviceSelect } from '../components/controls/MediaDeviceSelect';
import type { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';

interface KindWithInitialSelection {
  kind: MediaDeviceKind;
  initialSelection?: string;
}

interface MediaDeviceMenuPropsSingleKind extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: MediaDeviceKind;
  initialSelection?: string;
  onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
  tracks?: Partial<Record<MediaDeviceKind, LocalAudioTrack | LocalVideoTrack | undefined>>;
  /**
   * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
   * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
   * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
   * appropriate permissions.
   *
   * @see {@link PreJoin}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
   */
  requestPermissions?: boolean;
}

interface MediaDeviceMenuPropsMultiKind extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: KindWithInitialSelection[];
  initialSelection?: undefined;
  onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
  tracks?: Partial<Record<MediaDeviceKind, LocalAudioTrack | LocalVideoTrack | undefined>>;
  /**
   * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
   * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
   * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
   * appropriate permissions.
   *
   * @see {@link PreJoin}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
   */
  requestPermissions?: boolean;
}

/** @public */
export type MediaDeviceMenuProps = MediaDeviceMenuPropsSingleKind | MediaDeviceMenuPropsMultiKind;

/**
 * The `MediaDeviceMenu` component is a button that opens a menu that lists
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
 * @public
 */
export function MediaDeviceMenu({
  kind,
  initialSelection,
  onActiveDeviceChange,
  tracks,
  requestPermissions = false,
  ...props
}: MediaDeviceMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [updateRequired, setUpdateRequired] = React.useState<boolean>(true);
  const [needPermissions, setNeedPermissions] = React.useState(requestPermissions);

  const handleActiveDeviceChange = (kind: MediaDeviceKind, deviceId: string) => {
    log.debug('handle device change');
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };

  const button = React.useRef<HTMLButtonElement>(null);
  const tooltip = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (isOpen) {
      setNeedPermissions(true);
    }
  }, [isOpen]);

  React.useLayoutEffect(() => {
    let cleanup: ReturnType<typeof computeMenuPosition> | undefined;
    if (button.current && tooltip.current && (devices || updateRequired)) {
      cleanup = computeMenuPosition(button.current, tooltip.current, (x, y) => {
        if (tooltip.current) {
          Object.assign(tooltip.current.style, { left: `${x}px`, top: `${y}px` });
        }
      });
    }
    setUpdateRequired(false);
    return () => {
      cleanup?.();
    };
  }, [button, tooltip, devices, updateRequired]);

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

  // Normalize props to a consistent internal format
  const kindsWithInitialSelection: KindWithInitialSelection[] = (() => {
    if (kind === undefined) {
      // Default to audio and video inputs when no kind is specified
      return [{ kind: 'audioinput' as MediaDeviceKind }, { kind: 'videoinput' as MediaDeviceKind }];
    } else if (Array.isArray(kind)) {
      // multi-kind case: kind is KindWithInitialSelection[]
      return kind;
    } else {
      // single kind case: kind is MediaDeviceKind, initialSelection is string | undefined
      return [{ kind, initialSelection }];
    }
  })();

  const kindLabels: Record<MediaDeviceKind, string> = {
    audioinput: 'Audio inputs',
    videoinput: 'Video inputs',
    audiooutput: 'Audio outputs',
  };

  return (
    <>
      <button
        className="lk-button lk-button-menu"
        aria-pressed={isOpen}
        {...props}
        onClick={() => setIsOpen(!isOpen)}
        ref={button}
      >
        {props.children}
      </button>
      {/** only render when enabled in order to make sure that the permissions are requested only if the menu is enabled */}
      {!props.disabled && (
        <div
          className="lk-device-menu"
          ref={tooltip}
          style={{ visibility: isOpen ? 'visible' : 'hidden' }}
        >
          {kindsWithInitialSelection.map((kindInfo, idx, arr) => (
            <React.Fragment key={`device-group-${kindInfo.kind}`}>
              {arr.length > 1 && idx < arr.length && (
                <div className="lk-device-menu-heading">{kindLabels[kindInfo.kind]}</div>
              )}
              <MediaDeviceSelect
                kind={kindInfo.kind}
                initialSelection={kindInfo.initialSelection}
                onActiveDeviceChange={(deviceId) =>
                  handleActiveDeviceChange(kindInfo.kind, deviceId)
                }
                onDeviceListChange={setDevices}
                track={tracks?.[kindInfo.kind]}
                requestPermissions={needPermissions}
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
}
