import { mutedObserver, trackReference } from '@livekit/components-core';
import type { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureTrackReference } from '../context';

export interface UseIsMutedOptions {
  participant?: Participant;
}

export function useIsMuted(source: Track.Source, options: UseIsMutedOptions = {}) {
  const maybeTrackRef = options.participant
    ? trackReference(options.participant, source)
    : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);
  const [isMuted, setIsMuted] = React.useState(!!trackRef.participant.getTrack(source)?.isMuted);

  React.useEffect(() => {
    const listener = mutedObserver(trackRef.participant, source).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  }, [source, trackRef.participant]);

  return isMuted;
}
