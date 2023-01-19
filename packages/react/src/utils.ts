import * as React from 'react';
import { mergeProps as mergePropsReactAria } from './mergeProps';
import { Observable } from 'rxjs';
import useResizeObserver from '@react-hook/resize-observer';

export type LKComponentAttributes<T extends HTMLElement> = React.HTMLAttributes<T>;

/**
 * @internal
 */
export function isProp<U extends HTMLElement, T extends LKComponentAttributes<U>>(
  prop: T | undefined,
): prop is T {
  return prop !== undefined;
}

/**
 * @internal
 */
export function mergeProps<
  U extends HTMLElement,
  T extends Array<LKComponentAttributes<U> | undefined>,
>(...props: T) {
  return mergePropsReactAria(...props.filter(isProp));
}

/**
 * @internal
 */
export function useObservableState<T>(
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
export function cloneSingleChild(
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

export const useSize = (target: React.RefObject<HTMLDivElement>) => {
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

export type TokenizeGrammar = { [type: string]: RegExp };

export function tokenize(message: string, grammar: TokenizeGrammar) {
  const matches = Object.entries(grammar)
    .map(([type, rx], weight) =>
      Array.from(message.matchAll(rx)).map(({ index, 0: content }) => ({
        type,
        weight,
        content,
        index: index ?? 0,
      })),
    )
    .flat()
    .sort((a, b) => {
      const d = a.index - b.index;
      return d != 0 ? d : a.weight - b.weight;
    })
    .filter(({ index }, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      return prev.index + prev.content.length <= index;
    });

  const tokens = [];
  let pos = 0;
  for (const { type, content, index } of matches) {
    if (index > pos) tokens.push(message.substring(pos, index));
    tokens.push({ type, content });
    pos = index + content.length;
  }
  return tokens;
}
