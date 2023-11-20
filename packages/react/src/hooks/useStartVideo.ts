import { setupStartVideo } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../context';
import { mergeProps } from '../mergeProps';
import { useObservableState } from './internal';

/** @alpha */
export interface UseStartVideoProps {
  room?: Room;
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

/**
 * In some browsers to start video playback in low power mode, the user must perform a user-initiated event such as clicking a button.
 * The `useStartVideo` hook returns an object with a boolean `canPlayVideo` flag
 * that indicates whether video playback is allowed in the current context,
 * as well as a `startVideo` function that can be called in a button `onClick` callback to start video playback in the current context.
 *
 * @alpha
 */
export function useStartVideo({ room, props }: UseStartVideoProps) {
  const roomEnsured = useEnsureRoom(room);
  const { className, roomVideoPlaybackAllowedObservable, handleStartVideoPlayback } = React.useMemo(
    () => setupStartVideo(),
    [],
  );
  const observable = React.useMemo(
    () => roomVideoPlaybackAllowedObservable(roomEnsured),
    [roomEnsured, roomVideoPlaybackAllowedObservable],
  );
  const { canPlayVideo } = useObservableState(observable, {
    canPlayVideo: roomEnsured.canPlaybackVideo,
  });

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: () => {
          handleStartVideoPlayback(roomEnsured);
        },
        style: { display: canPlayVideo ? 'none' : 'block' },
      }),
    [props, className, canPlayVideo, handleStartVideoPlayback, roomEnsured],
  );

  return { mergedProps, canPlayVideo };
}
