import * as React from 'react';
import { useEnsureRoom } from '../../context';
import { useStartAudio } from '../../hooks';
import { Room } from 'livekit-client';

/** @public */
export interface AllowAudioPlaybackProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  room?: Room;
  label: string;
}

/**
 * The `StartAudio` component is only visible when the browser blocks audio playback. This is due to some browser implemented autoplay policies.
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
export const StartAudio: (
  props: AllowAudioPlaybackProps & React.RefAttributes<HTMLButtonElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLButtonElement, AllowAudioPlaybackProps>(
  function StartAudio({ label = 'Allow Audio', ...props }: AllowAudioPlaybackProps, ref) {
    const room = useEnsureRoom(props.room);
    const { mergedProps } = useStartAudio({ room, props });

    return (
      <button ref={ref} {...mergedProps}>
        {label}
      </button>
    );
  },
);
