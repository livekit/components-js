import { TrackParticipantPair, trackParticipantPairsObservable } from '@livekit/components-core';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../context';

type UseTracksOptions = {
  updateOnlyOn?: RoomEvent[];
};

/**
 * The useTracks hook returns Array<TrackParticipantPair> which combine the track and the corresponding participant of the track.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a `filter` function or setting the `excludePinnedTrack` property.
 *
 * @example
 * ```ts
 * const pairs = useTracks(sources: [Track.Source.Camera])
 * ```
 */
export function useTracks(sources: Array<Track.Source>, options: UseTracksOptions = {}) {
  const room = useRoomContext();
  const [pairs, setPairs] = React.useState<TrackParticipantPair[]>([]);
  React.useEffect(() => {
    const subscription = trackParticipantPairsObservable(room, sources, {
      additionalRoomEvents: options.updateOnlyOn,
    }).subscribe(setPairs);

    return () => subscription.unsubscribe();
  }, [room, JSON.stringify(options.updateOnlyOn), JSON.stringify(sources)]);

  return pairs;
}
