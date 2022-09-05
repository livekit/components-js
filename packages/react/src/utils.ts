import { HTMLAttributes } from 'react';
import { mergeProps as mergePropsReactAria } from 'react-aria';

function isProp(prop: HTMLAttributes<any> | undefined): prop is HTMLAttributes<any> {
  return prop !== undefined;
}

const mergeProps = (...props: Array<HTMLAttributes<any> | undefined>) => {
  return mergePropsReactAria(...props.filter(isProp));
};

export { mergeProps };
