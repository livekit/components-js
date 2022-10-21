import React, { HTMLAttributes, ReactNode, useEffect, useState } from 'react';
import { mergeProps as mergePropsReactAria } from 'react-aria';
import { Observable } from 'rxjs';

type LKComponentAttributes<T extends HTMLElement> = HTMLAttributes<T> & {};

function isProp<U extends HTMLElement, T extends LKComponentAttributes<U>>(
  prop: T | undefined,
): prop is T {
  return prop !== undefined;
}

function mergeProps<U extends HTMLElement, T extends Array<LKComponentAttributes<U> | undefined>>(
  ...props: T
) {
  return mergePropsReactAria(...props.filter(isProp));
}

function useObservableState<T>(
  observable: Observable<T>,
  startWith: T,
  dependencies: Array<any> = [observable],
) {
  const [state, setState] = useState<T>(startWith);
  useEffect(() => {
    // observable state doesn't run in SSR
    if (typeof window === 'undefined') return;
    const subscription = observable.subscribe(setState);
    return () => subscription.unsubscribe();
  }, dependencies);
  return state;
}

function cloneSingleChild(
  children: ReactNode | ReactNode[],
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

export { mergeProps, LKComponentAttributes, useObservableState, cloneSingleChild };
