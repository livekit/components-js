import type { LocalTrackSignalState, ToggleSource } from '@livekit/components-core';
import { setupMediaToggle, setupManualToggle, log } from '@livekit/components-core';
import * as React from 'react';
import type { TrackToggleProps } from '../components';
import { useMaybeRoomContext, useRoomContext } from '../context';
import { mergeProps } from '../mergeProps';
import { useObservableState } from './internal';
import { useRoomStateSelector } from './useRoomStateSelector';
import { Track } from 'livekit-client';

/** @public */
export interface UseTrackToggleProps<T extends ToggleSource>
  extends Omit<TrackToggleProps<T>, 'showIcon'> {}

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
  initialState,
  captureOptions,
  publishOptions,
  onDeviceError,
  ...rest
}: UseTrackToggleProps<T>) {
  const room = useMaybeRoomContext();
  const track = room?.localParticipant?.getTrackPublication(source);
  /** `true` if a user interaction such as a click on the TrackToggle button has occurred. */
  const userInteractionRef = React.useRef(false);

  const { toggle, className, pendingObserver, enabledObserver } = React.useMemo(
    () =>
      room
        ? setupMediaToggle<T>(source, room, captureOptions, publishOptions, onDeviceError)
        : setupManualToggle(),
    [room, source, JSON.stringify(captureOptions), publishOptions],
  );

  const pending = useObservableState(pendingObserver, false);
  const enabled = useObservableState(enabledObserver, initialState ?? !!track?.isEnabled);

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

  return {
    toggle,
    enabled,
    pending,
    track,
    buttonProps: {
      ...newProps,
      'aria-pressed': enabled,
      'data-lk-source': source,
      'data-lk-enabled': enabled,
      disabled: pending,
      onClick: clickHandler,
    } as React.ButtonHTMLAttributes<HTMLButtonElement>,
  };
}

export function useMicrophoneToggle(onChange?: (enabled: boolean, userInitiated: boolean) => void) {
  const state = useRoomContext();
  const isMicrophoneEnabled = useRoomStateSelector(
    (state) => state.localParticipant.isMicrophoneEnabled,
  );
  const [pending, setPending] = React.useState(false);
  /** `true` if a user interaction such as a click on the TrackToggle button has occurred. */
  const userInteractionRef = React.useRef(false);

  React.useEffect(() => {
    onChange?.(isMicrophoneEnabled, userInteractionRef.current);
    userInteractionRef.current = false;
  }, [isMicrophoneEnabled, onChange]);

  const toggle = React.useCallback(
    async (enabled: boolean) => {
      setPending(true);
      userInteractionRef.current = true;
      const track = await state.actions.setMicrophoneEnabled(enabled);
      setPending(false);
      return track;
    },
    [state],
  );
  return {
    source: Track.Source.Microphone,
    toggle,
    enabled: isMicrophoneEnabled,
    pending,
  };
}

export function useToggleButton(
  toggleState: ReturnType<typeof useMicrophoneToggle>,
  onError?: (error: Error) => void,
) {
  const { source, enabled, pending, toggle } = toggleState;
  return {
    props: {
      'aria-pressed': enabled,
      'data-lk-source': source,
      'data-lk-enabled': enabled,
      disabled: pending,
      onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
        toggle(!enabled).catch((error) => onError?.(error));
      },
    },
  };
}
