import type { TrackReferenceOrPlaceholder, TrackSource } from '@livekit/components-core';
import { setupMediaTrack, getTrackByIdentifier } from '@livekit/components-core';
import * as React from 'react';
import { Track } from 'livekit-client';

/**
 * @internal
 */
export function useTrackRefBySourceOrName(
  source: TrackSource<Track.Source>,
): TrackReferenceOrPlaceholder {
  const [publication, setPublication] = React.useState(getTrackByIdentifier(source));

  const { trackObserver } = React.useMemo(() => {
    return setupMediaTrack(source);
  }, [source.participant.sid ?? source.participant.identity, source.source]);

  React.useEffect(() => {
    const subscription = trackObserver.subscribe((publication) => {
      setPublication(publication);
    });
    return () => subscription?.unsubscribe();
  }, [trackObserver]);

  return {
    participant: source.participant,
    source: source.source ?? Track.Source.Unknown,
    publication,
  };
}
