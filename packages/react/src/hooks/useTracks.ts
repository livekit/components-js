import {
  isSourceWitOptions,
  MaybeTrackParticipantPair,
  SourcesArray,
  TrackParticipantPair,
  trackParticipantPairsObservable,
  TrackSourceWithOptions,
} from '@livekit/components-core';
import { Participant, RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../context';

type UseTracksOptions = {
  updateOnlyOn?: RoomEvent[];
};

type UseTracksHookReturnType<T> = T extends Track.Source[]
  ? TrackParticipantPair[]
  : T extends TrackSourceWithOptions[]
  ? MaybeTrackParticipantPair[]
  : never;

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
export function useTracks<T extends SourcesArray>(
  sources: T,
  options: UseTracksOptions = {},
): UseTracksHookReturnType<T> {
  const room = useRoomContext();
  const [pairs, setPairs] = React.useState<TrackParticipantPair[]>([]);
  const [, setParticipants] = React.useState<Participant[]>([]);

  const sources_ = React.useMemo(() => {
    return sources.map((s) => (isSourceWitOptions(s) ? s.source : s));
  }, [JSON.stringify(sources)]);

  React.useEffect(() => {
    const subscription = trackParticipantPairsObservable(room, sources_, {
      additionalRoomEvents: options.updateOnlyOn,
    }).subscribe(({ trackBundles, participants }) => {
      setPairs(trackBundles);
      setParticipants(participants);
    });
    return () => subscription.unsubscribe();
  }, [room, JSON.stringify(options.updateOnlyOn), JSON.stringify(sources)]);

  return pairs as UseTracksHookReturnType<T>;
}
