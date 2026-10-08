import type { ToggleSource } from '@livekit/components-core';
import { setupMediaToggle, setupManualToggle, log } from '@livekit/components-core';
import { Track, RoomEvent } from 'livekit-client';
import * as React from 'react';
import { type Room } from 'livekit-client';
import type { TrackToggleProps } from '../components';
import { useMaybeRoomContext } from '../context';
import { mergeProps } from '../mergeProps';
import { useObservableState } from './internal';

/** @public */
export interface UseTrackToggleProps<T extends ToggleSource> extends Omit<
  TrackToggleProps<T>,
  'showIcon'
> {
  room?: Room;
}

/**
 * The `useTrackToggle` hook is used to implement the `TrackToggle` component and returns state
 * and functionality of the given track.
 *
 * @example
 * ```tsx
 * const { buttonProps, enabled } = useTrackToggle(trackRef);
 * return <button {...buttonProps}>{enabled ? 'disable' : 'enable'}</button>;
 * ```
 * @public
 */
export function useTrackToggle<T extends ToggleSource>({
  source,
  onChange,
  onPermissionsChange,
  initialState,
  captureOptions,
  publishOptions,
  onDeviceError,
  room,
  ...rest
}: UseTrackToggleProps<T>) {
  const roomFromContext = useMaybeRoomContext();
  const roomFallback = React.useMemo(() => room ?? roomFromContext, [room, roomFromContext]);
  const track = roomFallback?.localParticipant?.getTrackPublication(source);
  /** `true` if a user interaction such as a click on the TrackToggle button has occurred. */
  const userInteractionRef = React.useRef(false);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const isPermissionError = React.useCallback((error: Error) => {
    const name = (error.name || '').toLowerCase();
    const message = (error.message || '').toLowerCase();
    return (
      name.includes('notallowed') ||
      name.includes('permissiondenied') ||
      name.includes('security') ||
      message.includes('permission denied') ||
      message.includes('denied by system') ||
      message.includes('blocked')
    );
  }, []);
  const handleToggleDeviceError = React.useCallback(
    (error: Error) => {
      if (isPermissionError(error)) {
        setPermissionDenied(true);
      }
      onDeviceError?.(error);
    },
    [isPermissionError, onDeviceError],
  );

  const { toggle, className, pendingObserver, enabledObserver } = React.useMemo(
    () =>
      roomFallback
        ? setupMediaToggle<T>(
            source,
            roomFallback,
            captureOptions,
            publishOptions,
            handleToggleDeviceError,
          )
        : setupManualToggle(),
    [roomFallback, source, captureOptions, publishOptions, handleToggleDeviceError],
  );

  const pending = useObservableState(pendingObserver, false);
  const enabled = useObservableState(enabledObserver, initialState ?? !!track?.isEnabled);

  React.useEffect(() => {
    if (enabled && permissionDenied) {
      setPermissionDenied(false);
    }
  }, [enabled, permissionDenied]);

  React.useEffect(() => {
    onPermissionsChange?.(permissionDenied);
  }, [permissionDenied, onPermissionsChange]);

  // On mount (and when source changes), check browser-level permissions when available.
  // This catches the case where permissions were denied before toggle interaction.
  React.useEffect(() => {
    if (source !== Track.Source.Microphone && source !== Track.Source.Camera) {
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
      return;
    }

    let permissionStatus: PermissionStatus | undefined;
    const permissionName: PermissionName =
      source === Track.Source.Microphone ? 'microphone' : 'camera';

    const updatePermissionDenied = () => {
      if (!permissionStatus) return;
      setPermissionDenied(permissionStatus.state === 'denied');
    };

    navigator.permissions
      .query({ name: permissionName })
      .then((status) => {
        permissionStatus = status;
        updatePermissionDenied();
        permissionStatus.onchange = updatePermissionDenied;
      })
      .catch(() => {
        // Some browsers do not support querying camera/microphone permissions.
      });

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [source]);

  // Listen for device errors to detect permission denied
  React.useEffect(() => {
    if (!roomFallback) return;

    const handleDeviceError = (error: Error, kind?: MediaDeviceKind) => {
      // Check if it's a permission denied error
      const message = (error.message || '').toLowerCase();

      if (!isPermissionError(error)) return;

      // Determine if this error is for the current source
      const errorMsg = message;
      const isMicrophoneError =
        kind === 'audioinput' || errorMsg.includes('microphone') || errorMsg.includes('audio');
      const isCameraError =
        kind === 'videoinput' || errorMsg.includes('camera') || errorMsg.includes('video');

      if (
        (source === Track.Source.Microphone && isMicrophoneError) ||
        (source === Track.Source.Camera && isCameraError)
      ) {
        setPermissionDenied(true);
      }
    };

    // Listen to room MediaDevicesError events
    roomFallback.on(RoomEvent.MediaDevicesError, handleDeviceError);

    return () => {
      roomFallback.off(RoomEvent.MediaDevicesError, handleDeviceError);
    };
  }, [roomFallback, source, isPermissionError]);

  React.useEffect(() => {
    onChange?.(enabled, userInteractionRef.current);
    userInteractionRef.current = false;
  }, [enabled, onChange]);

  React.useEffect(() => {
    if (initialState !== undefined) {
      log.debug('forcing initial toggle state', source, initialState);
      toggle(initialState);
    }
    // only execute once at the beginning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newProps = React.useMemo(() => mergeProps(rest, { className }), [rest, className]);

  const clickHandler: React.MouseEventHandler<HTMLButtonElement> = React.useCallback(
    (evt) => {
      userInteractionRef.current = true;
      toggle().catch(() => (userInteractionRef.current = false));
      rest.onClick?.(evt);
    },
    [rest, toggle],
  );

  return {
    toggle,
    enabled,
    pending,
    permissionDenied,
    track,
    buttonProps: {
      ...newProps,
      'aria-pressed': enabled,
      'data-lk-source': source,
      'data-lk-enabled': enabled,
      disabled: pending || (permissionDenied && !rest.onClick),
      onClick: clickHandler,
    } as React.ButtonHTMLAttributes<HTMLButtonElement>,
  };
}
