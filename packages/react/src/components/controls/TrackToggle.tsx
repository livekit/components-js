import type { CaptureOptionsBySource, ToggleSource } from '@livekit/components-core';
import * as React from 'react';
import { ExclamationIcon } from '../../assets/icons';
import { getSourceIcon } from '../../assets/icons/util';
import { useTrackToggle } from '../../hooks';
import type { TrackPublishOptions } from 'livekit-client';

/** @public */
export interface TrackToggleProps<T extends ToggleSource> extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> {
  source: T;
  showIcon?: boolean;
  initialState?: boolean;
  /** When true, renders a disabled-style toggle that indicates permissions are denied. */
  permissionDenied?: boolean;
  /**
   * Function that is called when the enabled state of the toggle changes.
   * The second function argument `isUserInitiated` is `true` if the change was initiated by a user interaction, such as a click.
   */
  onChange?: (enabled: boolean, isUserInitiated: boolean) => void;
  /** Called when permission-denied state changes (also called on initial mount). */
  onPermissionsChange?: (permissionDenied: boolean) => void;
  captureOptions?: CaptureOptionsBySource<T>;
  publishOptions?: TrackPublishOptions;
  onDeviceError?: (error: Error) => void;
}

/**
 * With the `TrackToggle` component it is possible to mute and unmute your camera and microphone.
 * The component uses an html button element under the hood so you can treat it like a button.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <TrackToggle source={Track.Source.Microphone} />
 *   <TrackToggle source={Track.Source.Camera} />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const TrackToggle = React.forwardRef(function TrackToggle<T extends ToggleSource>(
  { showIcon, permissionDenied: permissionDeniedProp, ...props }: TrackToggleProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    buttonProps,
    enabled,
    permissionDenied: permissionDeniedFromHook,
  } = useTrackToggle(props);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Use prop if provided, otherwise use hook's automatic detection - Prop needed when no room instance is available
  const isPermissionDenied = permissionDeniedProp ?? permissionDeniedFromHook;

  if (!isClient) return null;

  if (isPermissionDenied) {
    const buttonClassName = ['lk-permission-denied', 'lk-button', props.className]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        aria-pressed={false}
        data-lk-source={props.source}
        className={buttonClassName}
        onClick={props.onClick}
        type={props.type}
        disabled={props.disabled}
      >
        {(showIcon ?? true) && getSourceIcon(props.source, false)}
        {props.children}
        <div className="lk-permission-warning-icon">
          <ExclamationIcon />
        </div>
      </button>
    );
  }

  return (
    <button ref={ref} {...buttonProps}>
      {(showIcon ?? true) && getSourceIcon(props.source, enabled)}
      {props.children}
    </button>
  );
}) as <T extends ToggleSource>(
  props: TrackToggleProps<T> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;
