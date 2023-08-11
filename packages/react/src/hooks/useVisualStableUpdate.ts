import { TrackReferenceOrPlaceholder, getTrackReferenceId } from '@livekit/components-core';
import { log, sortTrackReferences, updatePages } from '@livekit/components-core';
import * as React from 'react';
import { useSpeakingParticipants } from './useSpeakingParticipants';

/** @public */
export interface UseVisualStableUpdateOptions {
  /** Overwrites the default sort function. */
  customSortFunction?: (
    trackReferences: TrackReferenceOrPlaceholder[],
  ) => TrackReferenceOrPlaceholder[];
}

/**
 * The useVisualStableUpdate hook tries to keep visual updates of the TackBundles array to a minimum,
 * while still trying to display important tiles such as speaking participants or screen shares.
 *
 * Updating works with pagination. For example, if a participant starts speaking on the second page,
 * they will be moved to the first page by replacing the least active/interesting participant on the first page.
 *
 * @beta
 */
export function useVisualStableUpdate(
  /** `TrackReference`s to display in the grid.  */
  trackReferences: TrackReferenceOrPlaceholder[],
  maxItemsOnPage: number,
  options: UseVisualStableUpdateOptions = {},
): TrackReferenceOrPlaceholder[] {
  const lastMaxItemsOnPage = React.useRef<number>(-1);
  const layoutChanged = maxItemsOnPage !== lastMaxItemsOnPage.current;

  const [updatedTrackRefs, setUpdatedTrackRefs] = React.useState(trackReferences);

  const speakers = useSpeakingParticipants();

  React.useEffect(() => {
    const sortedTrackRefs =
      typeof options.customSortFunction === 'function'
        ? options.customSortFunction(trackReferences)
        : sortTrackReferences(trackReferences);

    let newTrackRefs: TrackReferenceOrPlaceholder[] = [...sortedTrackRefs];
    if (layoutChanged === false) {
      try {
        newTrackRefs = updatePages(updatedTrackRefs, sortedTrackRefs, maxItemsOnPage);
      } catch (error) {
        log.error('Error while running updatePages(): ', error);
      }
      if (
        JSON.stringify(newTrackRefs.map(getTrackReferenceId)) !==
        JSON.stringify(updatedTrackRefs.map(getTrackReferenceId))
      ) {
        setUpdatedTrackRefs(newTrackRefs);
      }
    }

    lastMaxItemsOnPage.current = maxItemsOnPage;
  }, [speakers, layoutChanged, maxItemsOnPage, trackReferences, updatedTrackRefs]);

  return updatedTrackRefs;
}
