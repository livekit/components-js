import * as React from 'react';
import { useMaybeRoomContext } from '../../context';
import { setupDeviceSelector, createMediaDeviceObserver } from '@livekit/components-core';
import { mergeProps } from '../../utils';
import type { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
import { useObservableState } from '../../hooks/internal/useObservableState';

/** @public */
export function useMediaDevices({ kind }: { kind: MediaDeviceKind }) {
  const deviceObserver = React.useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  return devices;
}

/** @public */
export interface UseMediaDeviceSelectProps {
  kind: MediaDeviceKind;
  room?: Room;
  track?: LocalAudioTrack | LocalVideoTrack;
}

/** @public */
export function useMediaDeviceSelect({ kind, room, track }: UseMediaDeviceSelectProps) {
  const roomContext = useMaybeRoomContext();
  // List of all devices.
  const deviceObserver = React.useMemo(() => createMediaDeviceObserver(kind), [kind]);
  const devices = useObservableState(deviceObserver, []);
  // Active device management.
  const [currentDeviceId, setCurrentDeviceId] = React.useState<string>('');
  const { className, activeDeviceObservable, setActiveMediaDevice } = React.useMemo(
    () => setupDeviceSelector(kind, room ?? roomContext, track),
    [kind, room, roomContext, track],
  );

  React.useEffect(() => {
    const listener = activeDeviceObservable.subscribe((deviceId) => {
      if (deviceId) setCurrentDeviceId(deviceId);
    });
    return () => {
      listener?.unsubscribe();
    };
  }, [activeDeviceObservable]);

  return { devices, className, activeDeviceId: currentDeviceId, setActiveMediaDevice };
}

/** @public */
export interface MediaDeviceSelectProps extends React.HTMLAttributes<HTMLUListElement> {
  kind: MediaDeviceKind;
  onActiveDeviceChange?: (deviceId: string) => void;
  onDeviceListChange?: (devices: MediaDeviceInfo[]) => void;
  onDeviceSelectError?: (e: Error) => void;
  initialSelection?: string;
  /** will force the browser to only return the specified device
   * will call `onDeviceSelectError` with the error in case this fails
   */
  exactMatch?: boolean;
  track?: LocalAudioTrack | LocalVideoTrack;
}

/**
 * The MediaDeviceSelect list all media devices of one kind.
 * Clicking on one of the listed devices make it the active media device.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceSelect kind='audioinput' />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function MediaDeviceSelect({
  kind,
  initialSelection,
  onActiveDeviceChange,
  onDeviceListChange,
  onDeviceSelectError,
  exactMatch,
  track,
  ...props
}: MediaDeviceSelectProps) {
  const room = useMaybeRoomContext();
  const { devices, activeDeviceId, setActiveMediaDevice, className } = useMediaDeviceSelect({
    kind,
    room,
    track,
  });
  React.useEffect(() => {
    if (initialSelection) {
      setActiveMediaDevice(initialSelection);
    }
  }, [setActiveMediaDevice]);

  React.useEffect(() => {
    if (typeof onDeviceListChange === 'function') {
      onDeviceListChange(devices);
    }
  }, [onDeviceListChange, devices]);

  React.useEffect(() => {
    if (activeDeviceId && activeDeviceId !== '') {
      onActiveDeviceChange?.(activeDeviceId);
    }
  }, [activeDeviceId]);

  const handleActiveDeviceChange = async (deviceId: string) => {
    try {
      await setActiveMediaDevice(deviceId, { exact: exactMatch });
    } catch (e) {
      if (e instanceof Error) {
        onDeviceSelectError?.(e);
      } else {
        throw e;
      }
    }
  };
  // Merge Props
  const mergedProps = React.useMemo(
    () => mergeProps(props, { className }, { className: 'lk-list' }),
    [className, props],
  );

  return (
    <ul {...mergedProps}>
      {devices.map((device) => (
        <li
          key={device.deviceId}
          id={device.deviceId}
          data-lk-active={device.deviceId === activeDeviceId}
          aria-selected={device.deviceId === activeDeviceId}
          role="option"
        >
          <button className="lk-button" onClick={() => handleActiveDeviceChange(device.deviceId)}>
            {device.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
