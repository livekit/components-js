import type { TrackReferenceOrPlaceholder, TrackSource } from '@livekit/components-core';
import { setupMediaTrack, getTrackByIdentifier } from '@livekit/components-core';
import * as React from 'react';
import { Track } from 'livekit-client';

/**
 * @internal
 */
export function useTrackRefBySourceOrName<Source extends TrackSource<TS>, TS extends Track.Source>(
  source: Source,
): Source['source'] extends undefined ? TrackReferenceOrPlaceholder : TrackReferenceOrPlaceholder<TS> {
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
    source: (source.source ?? Track.Source.Unknown) as TS,
    publication,
  };
}
