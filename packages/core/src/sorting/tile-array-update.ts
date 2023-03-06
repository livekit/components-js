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
import { chunk, zip } from 'lodash';

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

  //TDOO: probably need to update this when switching to TrackBundles
  const stateSet = new Set(state);
  const nextSet = new Set(next);
  const droppedMembers = Array.from(difference(stateSet, nextSet));
  const addedMembers = Array.from(difference(nextSet, stateSet));

  return {
    dropped: droppedMembers,
    added: addedMembers,
  };
}

function listNeedsUpdating<T>(changes: Changes<T>): boolean {
  return changes.added.length !== 0 || changes.dropped.length !== 0;
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

export function dropItem<T>(itemToDrop: T, list: T[]): T[] {
  //TODO: const indexOfElementToDrop = findTrackBundleIndex(itemToDrop, list);
  const indexOfElementToDrop = list.findIndex((item) => item === itemToDrop, list);
  list.splice(indexOfElementToDrop, 1);
  return list;
}

export function divideIntoPages<T>(elements: T[], maxElementsOnPage: number): Array<T[]> {
  const pages = chunk(elements, maxElementsOnPage);
  return pages;
}

/** Divide the list of elements into pages and and check if pages need updating. */
export function updatePages<T>(currentList: T[], nextList: T[], maxItemsOnPage: number): T[] {
  let updatedList = [...currentList];
  const currentPages = divideIntoPages(currentList, maxItemsOnPage);
  const nextPages = divideIntoPages(nextList, maxItemsOnPage);

  zip(currentPages, nextPages).forEach(([currentPage, nextPage], pageIndex) => {
    if (currentPage && nextPage) {
      // 1) Identify  missing tile.
      const updatedPage = divideIntoPages(updatedList, maxItemsOnPage)[pageIndex];
      const changes = visualPageChange(updatedPage, nextPage);

      if (listNeedsUpdating(changes)) {
        console.log(
          `Detected visual changes on page: ${pageIndex}, current: ${currentPage}, next: ${nextPage}`,
          { changes },
        );
        // ## Swap Items
        if (changes.added.length === changes.dropped.length) {
          console.log(
            `Additions and removal are equal working with swaps: ${changes.added.length} === ${changes.dropped.length}`,
          );
          zip(changes.added, changes.dropped).forEach(([added, dropped]) => {
            if (added && dropped) {
              console.log(`Before swap action: `, updatedList);
              updatedList = swapItems(added, dropped, updatedList);
              console.log(`After swap action: `, updatedList);
            } else {
              throw new Error(
                `For a swap action we need a addition and a removal one is missing: ${added}, ${dropped}`,
              );
            }
          });
        }
        // ## Handle Drop Items
        if (changes.added.length === 0 && changes.dropped.length > 0) {
          changes.dropped.forEach((item) => {
            console.log(`Before drop action: `, updatedList);
            updatedList = dropItem(item, updatedList);
            console.log(`After drop action: `, updatedList);
          });
        }
      }
    }
  });

  return updatedList;
}
