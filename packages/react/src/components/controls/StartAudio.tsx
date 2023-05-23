import { setupStartAudio } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom, useRoomContext } from '../../context';
import { useObservableState } from '../../hooks/internal/useObservableState';
import { mergeProps } from '../../utils';

/** @alpha */
export interface UseStartAudioProps {
  room?: Room;
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

/**
 * In many browsers to start audio playback, the user must perform a user-initiated event such as clicking a button.
 * The `useStatAudio` hook returns an object with a boolean `canPlayAudio` flag
 * that indicates whether audio playback is allowed in the current context,
 * as well as a `startAudio` function that can be called in a button `onClick` callback to start audio playback in the current context.
 *
 * @see Autoplay policy on MDN web docs for more info: {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy}
 * @alpha
 */
export function useStartAudio({ room, props }: UseStartAudioProps) {
  const roomEnsured = useEnsureRoom(room);
  const { className, roomAudioPlaybackAllowedObservable, handleStartAudioPlayback } = React.useMemo(
    () => setupStartAudio(),
    [],
  );
  const observable = React.useMemo(
    () => roomAudioPlaybackAllowedObservable(roomEnsured),
    [roomEnsured, roomAudioPlaybackAllowedObservable],
  );
  const { canPlayAudio } = useObservableState(observable, { canPlayAudio: false });

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: () => {
          handleStartAudioPlayback(roomEnsured);
        },
        style: { display: canPlayAudio ? 'none' : 'block' },
      }),
    [props, className, canPlayAudio, handleStartAudioPlayback, roomEnsured],
  );

  return { mergedProps, canPlayAudio };
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
  const { mergedProps } = useStartAudio({ room, props });

  return <button {...mergedProps}>{label}</button>;
}
