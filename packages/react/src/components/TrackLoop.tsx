import {
  isParticipantTrackPinned,
  TrackFilter,
  TrackParticipantPair,
} from '@livekit/components-core';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext, useMaybeLayoutContext } from '../context';
import { useTracks } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

type TrackLoopProps = {
  /**
   * Array of all track sources that should be included as an item in the loop.
   */
  sources?: [Track.Source, ...Track.Source[]];
  /**
   * Set to `true` if pinned tracks should be included in the participant loop?
   */
  excludePinnedTracks?: boolean;
  filter?: TrackFilter;
  filterDependencies?: Array<unknown>;
  /**
   * To optimize performance, you can use the updateOnlyOn property to decide on
   * what RoomEvents the hook updates. By default it updates on all relevant RoomEvents
   * to keep all loop items up-to-date.
   * The minimal set of non-overwriteable RoomEvents is:  `[RoomEvent.LocalTrackPublished, RoomEvent.LocalTrackUnpublished, RoomEvent.TrackSubscriptionStatusChanged]`
   */
  updateOnlyOn?: RoomEvent[];
};

const trackLoopDefaults = {
  sources: [Track.Source.Camera],
  excludePinnedTracks: false,
  filterDependencies: [],
};

/**
 * The TrackLoop component loops over tracks. It is for example a easy way to loop over all participant camera and screen share tracks.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a filter function to the component.
 *
 * @example
 * ```tsx
 * {...}
 *   <TrackLoop sources=[Track.Source.Camera, Track.Source.ScreenShare]>
 *     {...}
 *   <TrackLoop />
 * {...}
 * ```
 */
export const TrackLoop = ({
  sources,
  excludePinnedTracks,
  filter,
  filterDependencies,
  updateOnlyOn,
  ...props
}: React.PropsWithChildren<TrackLoopProps>) => {
  const pairs = useTracks(sources ?? trackLoopDefaults.sources, {
    updateOnlyOn,
  });
  const layoutContext = useMaybeLayoutContext();
  const filterDependenciesArray = filterDependencies ?? [];
  const filteredPairs = React.useMemo(() => {
    let tempPairs: TrackParticipantPair[] = pairs;
    if (excludePinnedTracks && layoutContext?.pin?.state) {
      const pinState = layoutContext.pin.state;
      tempPairs = tempPairs.filter((pair) => !isParticipantTrackPinned(pair, pinState));
    }
    if (filter) {
      tempPairs = tempPairs.filter(filter);
    }
    return tempPairs;
  }, [excludePinnedTracks, filter, layoutContext, pairs, ...filterDependenciesArray]);

  return (
    <>
      {filteredPairs.map(({ track, participant }) => (
        <ParticipantContext.Provider
          value={participant}
          key={`${participant.identity}_${track.source}`}
        >
          {props.children ? (
            cloneSingleChild(props.children)
          ) : (
            <ParticipantTile trackSource={track.source} />
          )}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
