import * as React from 'react';
import { LocalParticipant, Participant, Room } from 'livekit-client';
import { encryptionStatusObservable } from '@livekit/components-core';
import { useEnsureParticipant, useEnsureRoom, useMaybeParticipantContext } from '../context';
import { useObservableState } from './internal';

/**
 * @alpha
 */
export interface UseIsEncryptedOptions {
  room?: Room;
}

/**
 * @alpha
 */
export function useIsEncrypted(participant?: Participant, options: UseIsEncryptedOptions = {}) {
  let p = useMaybeParticipantContext();
  if (participant) {
    p = participant;
  }

  const room = useEnsureRoom(options.room);

  const observer = React.useMemo(() => encryptionStatusObservable(room, p), [room, p]);
  const isEncrypted = useObservableState(
    observer,
    p instanceof LocalParticipant ? p.isE2EEEnabled : !!p?.isEncrypted,
  );
  return isEncrypted;
}
