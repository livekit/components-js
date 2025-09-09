import { activeSpeakerObserver } from '@livekit/components-core';
import * as React from 'react';
import { useMaybeRoomContext } from '../context';
import { useObservableState } from './internal';
import { Room } from 'livekit-client';

/**
 * The `useSpeakingParticipants` hook returns only the active speakers of all participants.
 *
 * @example
 * ```tsx
 * const activeSpeakers = useSpeakingParticipants();
 * ```
 * @public
 */
export function useSpeakingParticipants(room?: Room) {
  const roomContext = useMaybeRoomContext();
  const roomFallback = React.useMemo(() => room ?? roomContext ?? new Room(), [room, roomContext]);

  const speakerObserver = React.useMemo(() => activeSpeakerObserver(roomFallback), [roomFallback]);
  const activeSpeakers = useObservableState(speakerObserver, roomFallback.activeSpeakers);
  return activeSpeakers;
}
