import {
  concat,
  distinctUntilChanged,
  fromEvent,
  map,
  Observable,
  of,
  skipUntil,
  timeout,
} from 'rxjs';

/**
 * Returns true if the user is interacting with the HTML element,
 * and returns false if there is no interaction for a specified period of time.
 *
 * @internal
 */
export function createInteractingObservable(htmlElement: HTMLElement | null, inactiveAfter = 1000) {
  if (htmlElement === null) return of(false);
  const move$ = fromEvent(htmlElement, 'mousemove').pipe(map(() => true));
  const moveAndStop$: Observable<boolean> = move$.pipe(
    timeout({
      each: inactiveAfter,
      with: () => concat(of(false), moveAndStop$.pipe(skipUntil(move$))),
    }),
    distinctUntilChanged(),
  );
  return moveAndStop$;
}
