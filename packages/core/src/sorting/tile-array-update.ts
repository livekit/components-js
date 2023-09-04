import { differenceBy, chunk, zip } from '../helper/array-helper';
import { log } from '../logger';
import type { TrackReferenceOrPlaceholder } from '../track-reference';
import {
  getTrackReferenceId,
  isPlaceholderReplacement,
  isTrackReference,
  isTrackReferencePlaceholder,
} from '../track-reference';
import { flatTrackReferenceArray } from '../track-reference/test-utils';

type VisualChanges<T> = {
  dropped: T[];
  added: T[];
};

export type UpdatableItem = TrackReferenceOrPlaceholder | number;

/** Check to see if anything visually changes on the page. */
export function visualPageChange<T extends UpdatableItem>(state: T[], next: T[]): VisualChanges<T> {
  return {
    dropped: differenceBy(state, next, getTrackReferenceId),
    added: differenceBy(next, state, getTrackReferenceId),
  };
}

function listNeedsUpdating<T>(changes: VisualChanges<T>): boolean {
  return changes.added.length !== 0 || changes.dropped.length !== 0;
}

export function findIndex<T extends UpdatableItem>(
  trackReference: T,
  trackReferences: T[],
): number {
  const indexToReplace = trackReferences.findIndex(
    (trackReference_) =>
      getTrackReferenceId(trackReference_) === getTrackReferenceId(trackReference),
  );
  if (indexToReplace === -1) {
    throw new Error(
      `Element not part of the array: ${getTrackReferenceId(
        trackReference,
      )} not in ${flatTrackReferenceArray(trackReferences)}`,
    );
  }
  return indexToReplace;
}

/** Swap items in the complete list of all elements */
export function swapItems<T extends UpdatableItem>(
  moveForward: T,
  moveBack: T,
  trackReferences: T[],
): T[] {
  const indexToReplace = findIndex(moveForward, trackReferences);
  const indexReplaceWith = findIndex(moveBack, trackReferences);

  trackReferences.splice(indexToReplace, 1, moveBack);
  trackReferences.splice(indexReplaceWith, 1, moveForward);

  return trackReferences;
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
  let updatedList: T[] = refreshList(currentList, nextList);

  if (updatedList.length < nextList.length) {
    // Items got added: Find newly added items and add them to the end of the list.
    const addedItems = differenceBy(nextList, updatedList, getTrackReferenceId);
    updatedList = [...updatedList, ...addedItems];
  }
  const currentPages = divideIntoPages(updatedList, maxItemsOnPage);
  const nextPages = divideIntoPages(nextList, maxItemsOnPage);

  zip(currentPages, nextPages).forEach(([currentPage, nextPage], pageIndex) => {
    if (currentPage && nextPage) {
      // 1) Identify  missing tile.
      const updatedPage = divideIntoPages(updatedList, maxItemsOnPage)[pageIndex];
      const changes = visualPageChange(updatedPage, nextPage);

      if (listNeedsUpdating(changes)) {
        log.debug(
          `Detected visual changes on page: ${pageIndex}, current: ${flatTrackReferenceArray(
            currentPage,
          )}, next: ${flatTrackReferenceArray(nextPage)}`,
          { changes },
        );
        // ## Swap Items
        if (changes.added.length === changes.dropped.length) {
          zip(changes.added, changes.dropped).forEach(([added, dropped]) => {
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
            updatedList = dropItem<T>(item, updatedList);
          });
        }
        // ## Handle Item added
        if (changes.added.length > 0 && changes.dropped.length === 0) {
          changes.added.forEach((item) => {
            updatedList = addItem<T>(item, updatedList);
          });
        }
      }
    }
  });

  if (updatedList.length > nextList.length) {
    // Items got removed: Find items that got completely removed from the list.
    const missingItems = differenceBy(updatedList, nextList, getTrackReferenceId);
    updatedList = updatedList.filter(
      (item) => !missingItems.map(getTrackReferenceId).includes(getTrackReferenceId(item)),
    );
  }

  return updatedList;
}

/**
 * Update the current list with the items from the next list whenever the item ids are the same
 * or the current item is a placeholder and we find a track reference in the next list
 * to replace the placeholder with.
 * @remarks
 * This is needed because `TrackReference`s can change their internal state while keeping the same id.
 */
function refreshList<T extends UpdatableItem>(currentList: T[], nextList: T[]): T[] {
  return currentList.map((currentItem) => {
    const updateForCurrentItem = nextList.find(
      (newItem_) =>
        // If the IDs match or ..
        getTrackReferenceId(currentItem) === getTrackReferenceId(newItem_) ||
        // ... if the current item is a placeholder and the new item is the track reference can replace it.
        (typeof currentItem !== 'number' &&
          isTrackReferencePlaceholder(currentItem) &&
          isTrackReference(newItem_) &&
          isPlaceholderReplacement(currentItem, newItem_)),
    );
    return updateForCurrentItem ?? currentItem;
  });
}
