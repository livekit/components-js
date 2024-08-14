import { participantInfoObserver } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useMaybeParticipantContext } from '../context';
import { useObservableState } from './internal';

/**
 * The `useParticipantInfo` hook returns the identity, name, and metadata of a given participant.
 * It requires a `Participant` object passed as property or via the `ParticipantContext`.
 *
 * @example
 * ```tsx
 * const { identity, name, metadata } = useParticipantInfo({ participant });
 * ```
 * @public
 */
export interface UseParticipantInfoOptions {
  participant?: Participant;
}

/** @public */
export function useParticipantInfo(props: UseParticipantInfoOptions = {}) {
  let p = useMaybeParticipantContext();
  if (props.participant) {
    p = props.participant;
  }
  const infoObserver = React.useMemo(() => participantInfoObserver(p), [p]);
  const { identity, name, metadata } = useObservableState(infoObserver, {
    name: p?.name,
    identity: p?.identity,
    metadata: p?.metadata,
  });

  return { identity, name, metadata };
}
