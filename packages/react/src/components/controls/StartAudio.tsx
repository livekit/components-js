import { setupStartAudio } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../../context';
import { useObservableState } from '../../hooks/internal/useObservableState';
import { mergeProps } from '../../utils';

/**
 * In many browser to start audio playback, the user must perform a user-initiated event such as clicking a button.
 * The `useStatAudio` hook returns an object with a boolean `canPlayAudio` flag
 * that indicates whether audio playback is allowed in the current context,
 * as well as a `startAudio` function that can be called in a button `onClick` callback to start audio playback in the current context.
 *
 * @see Autoplay policy on MDN web docs for more info: {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy}
 * @alpha
 */
export function useStartAudio(room: Room) {
  const { roomAudioPlaybackAllowedObservable, handleStartAudioPlayback } = React.useMemo(
    () => setupStartAudio(),
    [],
  );

  function startAudio() {
    handleStartAudioPlayback(room);
  }

  const observable = React.useMemo(
    () => roomAudioPlaybackAllowedObservable(room),
    [room, roomAudioPlaybackAllowedObservable],
  );
  const { canPlayAudio } = useObservableState(observable, { canPlayAudio: false });

  return { canPlayAudio, startAudio };
}

/** @public */
export interface AllowAudioPlaybackProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

/**
 * The StartAudio component is only visible when the browser blocks audio playback. This is due to some browser implemented autoplay policies.
 * To start audio playback, the user must perform a user-initiated event such as clicking this button.
 * As soon as audio playback starts, the button hides itself again.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <StartAudio label="Click to allow audio playback" />
 * </LiveKitRoom>
 * ```
 *
 * @see Autoplay policy on MDN web docs: {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy}
 * @public
 */
export function StartAudio({ label = 'Allow Audio', ...props }: AllowAudioPlaybackProps) {
  const room = useRoomContext();
  const { canPlayAudio, startAudio } = useStartAudio(room);
  const { className } = React.useMemo(() => setupStartAudio(), []);

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: () => {
          startAudio();
        },
        style: { display: canPlayAudio ? 'none' : 'block' },
      }),
    [props, className, canPlayAudio, startAudio],
  );

  return <button {...mergedProps}>{label}</button>;
}
