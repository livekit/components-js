import { setupManualToggle, setupMediaToggle } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { mergeProps } from '../../mergeProps';
import { useMaybeRoomContext } from '../../contexts';
import { useObservableState } from '../../utils';

export type TrackToggleProps = Omit<React.HTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  source: Track.Source;
  initialState?: boolean; // FIXME: initialState false has no effect.
  onChange?: (enabled: boolean) => void;
};

export const TrackSource = Track.Source;

export function useTrackToggle({ source, onChange, initialState, ...rest }: TrackToggleProps) {
  const room = useMaybeRoomContext();
  const track = room?.localParticipant?.getTrack(source);

  // FIXME: adding initialState to useMemo dependencies leads to constant toggling of the buttons and browser freeze.
  const { toggle, className, pendingObserver, enabledObserver } = React.useMemo(
    () => (room ? setupMediaToggle(source, room) : setupManualToggle(!!initialState)),
    [room, source],
  );

  const pending = useObservableState(pendingObserver, false);
  const enabled = useObservableState(enabledObserver, !!track?.isEnabled);

  React.useEffect(() => {
    onChange?.(enabled);
  }, [enabled, onChange]);

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
    },
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
 */
export function TrackToggle(props: TrackToggleProps) {
  const { buttonProps } = useTrackToggle(props);
  return <button {...buttonProps}>{props.children}</button>;
}
