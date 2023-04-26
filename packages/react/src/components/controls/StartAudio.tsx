import { setupStartAudio } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../../context';
import { useObservableState } from '../../hooks/internal/useObservableState';
import { mergeProps } from '../../utils';

interface UseStartAudioProps {
  room: Room;
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

function useStartAudio({ room, props }: UseStartAudioProps) {
  const { className, roomAudioPlaybackAllowedObservable, handleStartAudioPlayback } = React.useMemo(
    () => setupStartAudio(),
    [],
  );
  const observable = React.useMemo(
    () => roomAudioPlaybackAllowedObservable(room),
    [room, roomAudioPlaybackAllowedObservable],
  );
  const { canPlayAudio } = useObservableState(observable, { canPlayAudio: false });

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: () => {
          handleStartAudioPlayback(room);
        },
        style: { display: canPlayAudio ? 'none' : 'block' },
      }),
    [props, className, canPlayAudio, handleStartAudioPlayback, room],
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
 *   <StartAudio>Click to allow audio playback</StartAudio>
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
