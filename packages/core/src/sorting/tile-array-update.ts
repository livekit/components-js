import { setDifference } from '../helper';
import { chunk, zip, difference, remove } from 'lodash';
import { trackBundleId, TrackBundleWithPlaceholder } from '../track-bundle';

type Changes<T> = {
  dropped: T[];
  added: T[];
};

/** Check if something visually change on the page. */
export function visualPageChange<T>(state: T[], next: T[]): Changes<T> {
  //TDOO: probably need to update this when switching to TrackBundles
  const stateSet = new Set(state);
  const nextSet = new Set(next);
  const droppedMembers = Array.from(setDifference(stateSet, nextSet));
  const addedMembers = Array.from(setDifference(nextSet, stateSet));

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
): number {
  const indexToReplace = trackBundles.findIndex(
    (trackBundle_) => trackBundleId(trackBundle_) === trackBundleId(trackBundle),
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

function addItem<T>(itemToAdd: T, list: T[]): T[] {
  return [...list, itemToAdd];
}

export function divideIntoPages<T>(elements: T[], maxElementsOnPage: number): Array<T[]> {
  const pages = chunk(elements, maxElementsOnPage);
  return pages;
}

/** Divide the list of elements into pages and and check if pages need updating. */
export function updatePages<T>(currentList: T[], nextList: T[], maxItemsOnPage: number): T[] {
  let updatedList = [...currentList];

  if (currentList.length < nextList.length) {
    // Items got added: Find newly added items and add them to the end of the list.
    const addedItems = difference(nextList, currentList);
    console.log(`Newly added items to the list: `, addedItems);
    updatedList = [...updatedList, ...addedItems];
  }
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
        // ## Handle Item added
        if (changes.added.length > 0 && changes.dropped.length === 0) {
          changes.added.forEach((item) => {
            updatedList = addItem(item, updatedList);
          });
        }
      }
    }
  });

  if (updatedList.length > nextList.length) {
    // Items got removed: Find items that got completely removed from the list.
    const missingItems = difference(currentList, nextList);
    console.log(`Items that are no longer part of the list: `, missingItems);
    remove(updatedList, (item) => missingItems.includes(item));
  }

  return updatedList;
}
