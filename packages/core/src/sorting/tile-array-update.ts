// export function updateArray<T>(
//   currentArray: T[],
//   newArray: any[],
//   currentItemsPerPage: number,
//   newItemsPerPage: number,
// ): T[] {
//   return currentArray;
// }

// import { Track } from 'livekit-client';
import { difference } from '../helper';
import { isTrackBundle, TrackBundleWithPlaceholder } from '../types';

type Changes<T> = {
  dropped: T[];
  added: T[];
};

/** Check if something visually change on the page. */
export function visualPageChange<T>(state: T[], next: T[]): Changes<T> {
  //   if (state.length !== next.length) {
  //     throw new Error(
  //       `This function can only compare arrays with the same number of elements. Got arrays with length: ${state.length} !== ${next.length}.`,
  //     );
  //   }
  const stateSet = new Set(state);
  const nextSet = new Set(next);
  const droppedMembers = Array.from(difference(stateSet, nextSet));
  const addedMembers = Array.from(difference(nextSet, stateSet));

  return {
    dropped: droppedMembers,
    added: addedMembers,
  };
}

export function findTrackBundleIndex(
  trackBundle: TrackBundleWithPlaceholder,
  trackBundles: TrackBundleWithPlaceholder[],
) {
  const indexToReplace = trackBundles.findIndex(
    (trackBundle_) =>
      trackBundle_.participant.identity === trackBundle.participant.identity &&
      (isTrackBundle(trackBundle_) ? trackBundle_.publication.source : trackBundle_.source) ===
        (isTrackBundle(trackBundle) ? trackBundle.publication.source : trackBundle.source),
  );
  if (indexToReplace === -1) {
    throw new Error(
      `Element not part of the array: ${trackBundle.participant.identity} not in ${trackBundles}`,
    );
  }
  return indexToReplace;
}

/** Swap items in the complete list of all elements */
export function swapItems<T>(moveForward: T, moveBack: T, trackBundles: T[]): T[] {
  //   const indexToReplace = findTrackBundleIndex(toReplace, trackBundles);
  //   const indexReplaceWith = findTrackBundleIndex(replaceWith, trackBundles);
  const indexToReplace = trackBundles.findIndex((bundle) => bundle === moveForward);
  const indexReplaceWith = trackBundles.findIndex((bundle) => bundle === moveBack);

  trackBundles.splice(indexToReplace, 1, moveBack);
  trackBundles.splice(indexReplaceWith, 1, moveForward);

  return trackBundles;
}
