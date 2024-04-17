import { sortParticipants } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useSpeakingParticipants } from './useSpeakingParticipants';

/**
 * The `useSortedParticipants` hook returns the participants sorted by importance.
 * @public
 */
export function useSortedParticipants(participants: Array<Participant>) {
  const [sortedParticipants, setSortedParticipants] = React.useState(
    sortParticipants(participants),
  );
  const activeSpeakers = useSpeakingParticipants();

  React.useEffect(() => {
    setSortedParticipants(sortParticipants(participants));
  }, [activeSpeakers, participants]);
  return sortedParticipants;
}
