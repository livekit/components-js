import * as React from 'react';
import { mergeProps as mergePropsReactAria } from './mergeProps';
import { Observable } from 'rxjs';
import useResizeObserver from '@react-hook/resize-observer';

type LKComponentAttributes<T extends HTMLElement> = React.HTMLAttributes<T>;

/**
 * @internal
 */
function isProp<U extends HTMLElement, T extends LKComponentAttributes<U>>(
  prop: T | undefined,
): prop is T {
  return prop !== undefined;
}

/**
 * @internal
 */
function mergeProps<U extends HTMLElement, T extends Array<LKComponentAttributes<U> | undefined>>(
  ...props: T
) {
  return mergePropsReactAria(...props.filter(isProp));
}

/**
 * @internal
 */
function useObservableState<T>(
  observable: Observable<T>,
  startWith: T,
  dependencies: Array<any> = [observable],
) {
  const [state, setState] = React.useState<T>(startWith);
  React.useEffect(() => {
    // observable state doesn't run in SSR
    if (typeof window === 'undefined') return;
    const subscription = observable.subscribe(setState);
    return () => subscription.unsubscribe();
  }, dependencies);
  return state;
}

/**
 * @internal
 */
function cloneSingleChild(
  children: React.ReactNode | React.ReactNode[],
  props?: Record<string, any>,
  key?: any,
) {
  return React.Children.map(children, (child) => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if (React.isValidElement(child) && React.Children.only(children)) {
      return React.cloneElement(child, { ...props, key });
    }
    return child;
  });
}

const useSize = (target: React.RefObject<HTMLDivElement>) => {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  React.useLayoutEffect(() => {
    if (target?.current) {
      const { width, height } = target.current.getBoundingClientRect();
      setSize({ width, height });
    }
  }, [target.current]);

  // Where the magic happens
  useResizeObserver(target, (entry) => setSize(entry.contentRect));
  return size;
};

export { mergeProps, LKComponentAttributes, useObservableState, cloneSingleChild, useSize };
