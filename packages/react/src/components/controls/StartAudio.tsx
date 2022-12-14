import { setupStartAudio } from '@livekit/components-core';
import { Room } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../../contexts';
import { mergeProps, useObservableState } from '../../utils';

interface UseStartAudioProps {
  room: Room;
  props: React.HTMLAttributes<HTMLButtonElement>;
}

function useStartAudio({ room, props }: UseStartAudioProps) {
  const { className, roomAudioPlaybackAllowedObservable, handleStartAudioPlayback } = React.useMemo(
    () => setupStartAudio(),
    [],
  );

  const { canPlayAudio } = useObservableState(
    roomAudioPlaybackAllowedObservable(room),
    { canPlayAudio: false },
    [roomAudioPlaybackAllowedObservable],
  );

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
interface AllowAudioPlaybackProps extends React.HTMLAttributes<HTMLButtonElement> {
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
 */
export function StartAudio({ label = 'Allow Audio', ...props }: AllowAudioPlaybackProps) {
  const room = useRoomContext();
  const { mergedProps } = useStartAudio({ room, props });

  return <button {...mergedProps}>{label}</button>;
}
