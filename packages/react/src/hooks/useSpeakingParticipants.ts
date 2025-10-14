import { activeSpeakerObserver } from '@livekit/components-core';
import * as React from 'react';
import { useEnsureRoom } from '../context';
import { useObservableState } from './internal';
import { Room } from 'livekit-client';

/** @public */
export type UseSpeakingParticipantsOptions = {
  room?: Room;
};

/**
 * The `useSpeakingParticipants` hook returns only the active speakers of all participants.
 *
 * @example
 * ```tsx
 * const activeSpeakers = useSpeakingParticipants();
 * ```
 * @public
 */
export function useSpeakingParticipants(options?: UseSpeakingParticipantsOptions) {
  const ensuredRoom = useEnsureRoom(options?.room);

  const speakerObserver = React.useMemo(() => activeSpeakerObserver(ensuredRoom), [ensuredRoom]);
  const activeSpeakers = useObservableState(speakerObserver, ensuredRoom.activeSpeakers);
  return activeSpeakers;
}
