import type { CaptureOptionsBySource, ToggleSource } from '@livekit/components-core';
import { log, setupManualToggle, setupMediaToggle } from '@livekit/components-core';
import * as React from 'react';
import { mergeProps } from '../../mergeProps';
import { useMaybeRoomContext } from '../../context';
import { getSourceIcon } from '../../assets/icons/util';
import { useObservableState } from '../../hooks/internal/useObservableState';

/** @public */
export type TrackToggleProps<T extends ToggleSource> = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> & {
  source: T;
  showIcon?: boolean;
  initialState?: boolean;
  onChange?: (enabled: boolean) => void;
  captureOptions?: CaptureOptionsBySource<T>;
};

/** @public */
export type UseTrackToggleProps<T extends ToggleSource> = Omit<TrackToggleProps<T>, 'showIcon'>;

/** @public */
export function useTrackToggle<T extends ToggleSource>({
  source,
  onChange,
  initialState,
  captureOptions,
  ...rest
}: UseTrackToggleProps<T>) {
  const room = useMaybeRoomContext();
  const track = room?.localParticipant?.getTrack(source);

  const { toggle, className, pendingObserver, enabledObserver } = React.useMemo(
    () => (room ? setupMediaToggle<T>(source, room, captureOptions) : setupManualToggle()),
    [room, source, JSON.stringify(captureOptions)],
  );

  const pending = useObservableState(pendingObserver, false);
  const enabled = useObservableState(enabledObserver, initialState ?? !!track?.isEnabled);

  React.useEffect(() => {
    onChange?.(enabled);
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
      toggle();
      rest.onClick?.(evt);
    },
    [rest, toggle],
  );

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

/**
 * With the TrackToggle component it is possible to mute and unmute your camera and microphone.
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
export function TrackToggle<T extends ToggleSource>({ showIcon, ...props }: TrackToggleProps<T>) {
  const { buttonProps, enabled } = useTrackToggle(props);
  return (
    <button {...buttonProps}>
      {(showIcon ?? true) && getSourceIcon(props.source, enabled)}
      {props.children}
    </button>
  );
}
