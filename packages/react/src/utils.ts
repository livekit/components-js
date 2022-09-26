import { Participant, TrackPublication } from 'livekit-client';
import React, { HTMLAttributes, useEffect, useState } from 'react';
import { mergeProps as mergePropsReactAria } from 'react-aria';
import { Observable } from 'rxjs';

interface LKEnhanceProps {
  participant?: Participant;
  publication?: TrackPublication;
}

interface LKMouseEvent<T extends HTMLElement> extends React.MouseEvent<T>, LKEnhanceProps {}

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

function enhanceProps<T extends HTMLElement>(
  props: LKComponentAttributes<T>,
  enhanced: LKEnhanceProps,
) {
  if (props.onClick) {
    props.onClick = (evt: LKMouseEvent<T>) => {
      evt.participant = enhanced.participant;
      evt.publication = enhanced.publication;
      props.onClick?.(evt);
    };
  }
}

function useObservableState<T>(
  observable: Observable<T>,
  startWith: T,
  dependencies: Array<any> = [observable],
) {
  const [state, setState] = useState<T>(startWith);
  useEffect(() => {
    const subscription = observable.subscribe(setState);
    return () => subscription.unsubscribe();
  }, dependencies);
  return state;
}

export { mergeProps, enhanceProps, LKComponentAttributes, LKMouseEvent, useObservableState };
