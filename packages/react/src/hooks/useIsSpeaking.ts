import { createIsSpeakingObserver, trackReference } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureTrackReference } from '../context';
import { useObservableState } from './internal';

export function useIsSpeaking(participant?: Participant) {
  const maybeTrack = participant ? trackReference(participant, Track.Source.Unknown) : undefined;
  const trackRef = useEnsureTrackReference(maybeTrack);
  const observable = React.useMemo(
    () => createIsSpeakingObserver(trackRef.participant),
    [trackRef.participant],
  );
  const isSpeaking = useObservableState(observable, trackRef.participant.isSpeaking);

  return isSpeaking;
}
