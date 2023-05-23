import type { Room } from 'livekit-client';
import * as React from 'react';
import { useObservableState } from './internal';
import { roomAudioPlaybackAllowedObservable } from '@livekit/components-core';

/**
 * In many browsers to start audio playback, the user must perform a user-initiated event such as clicking a button.
 * The `useAudioPlayback` hook returns an object with a boolean `canPlayAudio` flag that indicates whether audio
 * playback is allowed in the current context, as well as a `startAudio` function that can be called in a button
 * `onClick` callback to start audio playback in the current context.
 *
 * @see Autoplay policy on MDN web docs for more info: {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy}
 * @alpha
 */
export function useAudioPlayback(room: Room): {
  canPlayAudio: boolean;
  startAudio: () => Promise<void>;
} {
  const startAudio = React.useCallback(async () => {
    await room.startAudio();
  }, [room]);

  const observable = React.useMemo(() => roomAudioPlaybackAllowedObservable(room), [room]);
  const { canPlayAudio } = useObservableState(observable, { canPlayAudio: false });

  return { canPlayAudio, startAudio };
}
