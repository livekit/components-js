import * as React from 'react';
import { mergeProps as mergePropsReactAria } from './mergeProps';

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
