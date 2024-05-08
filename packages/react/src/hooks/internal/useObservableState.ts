import * as React from 'react';
// @ts-ignore
import type { Observable } from 'rxjs';

/**
 * @internal
 */
export function useObservableState<T>(
  observable: Observable<T> | undefined,
  startWith: T,
  resetWhenObservableChanges = true,
) {
  const [state, setState] = React.useState<T>(startWith);
  React.useEffect(() => {
    if (resetWhenObservableChanges) {
      setState(startWith);
    }
    // observable state doesn't run in SSR
    if (typeof window === 'undefined' || !observable) return;
    const subscription = observable.subscribe(setState);
    return () => subscription.unsubscribe();
  }, [observable, resetWhenObservableChanges]);
  return state;
}
