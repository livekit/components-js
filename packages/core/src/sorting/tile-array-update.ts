import { chunk, zip, differenceBy, remove } from 'lodash';
import log from '../logger';
import { getTrackBundleId, TrackBundleWithPlaceholder } from '../track-bundle';
import { flatTrackBundleArray } from '../track-bundle/test-utils';

type VisualChanges<T> = {
  dropped: T[];
  added: T[];
};

export type UpdatableItem = TrackBundleWithPlaceholder | number;

/** Check if something visually change on the page. */
export function visualPageChange<T extends UpdatableItem>(state: T[], next: T[]): VisualChanges<T> {
  return {
    dropped: differenceBy<T, T>(state, next, getTrackBundleId),
    added: differenceBy<T, T>(next, state, getTrackBundleId),
  };
}

function listNeedsUpdating<T>(changes: VisualChanges<T>): boolean {
  return changes.added.length !== 0 || changes.dropped.length !== 0;
}

export function findIndex<T extends UpdatableItem>(trackBundle: T, trackBundles: T[]): number {
  const indexToReplace = trackBundles.findIndex(
    (trackBundle_) => getTrackBundleId(trackBundle_) === getTrackBundleId(trackBundle),
  );
  if (indexToReplace === -1) {
    throw new Error(
      `Element not part of the array: ${getTrackBundleId(
        trackBundle,
      )} not in ${flatTrackBundleArray(trackBundles)}`,
    );
  }
  return indexToReplace;
}

/** Swap items in the complete list of all elements */
export function swapItems<T extends UpdatableItem>(
  moveForward: T,
  moveBack: T,
  trackBundles: T[],
): T[] {
  const indexToReplace = findIndex(moveForward, trackBundles);
  const indexReplaceWith = findIndex(moveBack, trackBundles);

  trackBundles.splice(indexToReplace, 1, moveBack);
  trackBundles.splice(indexReplaceWith, 1, moveForward);

  return trackBundles;
}

export function dropItem<T extends UpdatableItem>(itemToDrop: T, list: T[]): T[] {
  const indexOfElementToDrop = findIndex(itemToDrop, list);
  // const indexOfElementToDrop = list.findIndex((item) => item === itemToDrop, list);
  list.splice(indexOfElementToDrop, 1);
  return list;
}

function addItem<T extends UpdatableItem>(itemToAdd: T, list: T[]): T[] {
  return [...list, itemToAdd];
}

export function divideIntoPages<T>(list: T[], maxElementsOnPage: number): Array<T[]> {
  const pages = chunk(list, maxElementsOnPage);
  return pages;
}

/** Divide the list of elements into pages and and check if pages need updating. */
export function updatePages<T extends UpdatableItem>(
  currentList: T[],
  nextList: T[],
  maxItemsOnPage: number,
): T[] {
  let updatedList: T[] = [...currentList];

  if (currentList.length < nextList.length) {
    // Items got added: Find newly added items and add them to the end of the list.
    const addedItems = differenceBy<T, T>(nextList, currentList, getTrackBundleId);
    updatedList = [...updatedList, ...addedItems] as T[];
  }
  const currentPages = divideIntoPages(currentList, maxItemsOnPage);
  const nextPages = divideIntoPages(nextList, maxItemsOnPage);

  zip<T[], T[]>(currentPages, nextPages).forEach(([currentPage, nextPage], pageIndex) => {
    if (currentPage && nextPage) {
      // 1) Identify  missing tile.
      const updatedPage = divideIntoPages(updatedList, maxItemsOnPage)[pageIndex];
      const changes = visualPageChange(updatedPage, nextPage);

      if (listNeedsUpdating(changes)) {
        log.debug(
          `Detected visual changes on page: ${pageIndex}, current: ${flatTrackBundleArray(
            currentPage,
          )}, next: ${flatTrackBundleArray(nextPage)}`,
          { changes },
        );
        // ## Swap Items
        if (changes.added.length === changes.dropped.length) {
          zip<T>(changes.added as T[], changes.dropped as T[]).forEach(([added, dropped]) => {
            if (added && dropped) {
              updatedList = swapItems<T>(added, dropped, updatedList);
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
            updatedList = dropItem<T>(item as T, updatedList);
          });
        }
        // ## Handle Item added
        if (changes.added.length > 0 && changes.dropped.length === 0) {
          changes.added.forEach((item) => {
            updatedList = addItem<T>(item as T, updatedList);
          });
        }
      }
    }
  });

  if (updatedList.length > nextList.length) {
    // Items got removed: Find items that got completely removed from the list.
    const missingItems = differenceBy<T, T>(currentList, nextList, getTrackBundleId);
    remove(updatedList, (item) =>
      missingItems.map(getTrackBundleId).includes(getTrackBundleId(item)),
    );
  }

  return updatedList;
}
