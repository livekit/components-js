import { setupStartAudio, log } from '@livekit/components-core';
import { getEmptyAudioStreamTrack, type Room } from 'livekit-client';
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
  const { canPlayAudio } = useObservableState(observable, {
    canPlayAudio: roomEnsured.canPlaybackAudio,
  });

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

  log.warn(`canPlayAudio: ${canPlayAudio}`);

  const dummyAudio = React.useRef<HTMLAudioElement>();

  React.useEffect(() => {
    if (canPlayAudio && !dummyAudio.current) {
      dummyAudio.current = document.createElement('audio');
      dummyAudio.current.autoplay = true;
      //@ts-ignore
      dummyAudio.current.playsInline = true;
      dummyAudio.current.srcObject = new MediaStream([getEmptyAudioStreamTrack()]);
    }
  }, [canPlayAudio]);

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
  const { onClick, ...htmlProps } = mergedProps;
  const dummyAudio = React.useRef<HTMLAudioElement>(null);

  const handleClick = React.useCallback(
    (ev: React.MouseEvent<HTMLElement>) => {
      onClick?.(ev);
      if (dummyAudio.current) {
        const track = getEmptyAudioStreamTrack();
        track.enabled = true;
        dummyAudio.current.srcObject = new MediaStream([track]);
        dummyAudio.current?.play();
      }
    },
    [onClick],
  );
  return (
    <button onClick={handleClick} {...htmlProps}>
      {label}
      <audio ref={dummyAudio} autoPlay playsInline />
    </button>
  );
}
