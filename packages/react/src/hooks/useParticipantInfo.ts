import { participantInfoObserver } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
import { useObservableState } from './internal';

/** @public */
export interface UseParticipantInfoOptions {
  participant?: Participant;
}

/** @public */
export function useParticipantInfo(props: UseParticipantInfoOptions = {}) {
  const p = useEnsureParticipant(props.participant);
  const infoObserver = React.useMemo(() => participantInfoObserver(p), [p]);
  const { identity, name, metadata } = useObservableState(infoObserver, {
    name: p.name,
    identity: p.identity,
    metadata: p.metadata,
  });

  return { identity, name, metadata };
}
