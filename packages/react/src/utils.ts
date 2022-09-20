import { Participant, TrackPublication } from 'livekit-client';
import React, { HTMLAttributes } from 'react';
import { mergeProps as mergePropsReactAria } from 'react-aria';

interface LKEnhanceProps {
  participant?: Participant;
  publication?: TrackPublication;
}

interface LKMouseEvent<T extends HTMLElement> extends React.MouseEvent<T>, LKEnhanceProps {}

type LKComponentAttributes<T extends HTMLElement> = Omit<HTMLAttributes<T>, 'onClick'> & {
  onClick?: (evt: LKMouseEvent<T>) => void;
};

function isProp(prop: LKComponentAttributes<any> | undefined): prop is LKComponentAttributes<any> {
  return prop !== undefined;
}

const mergeProps = (...props: Array<LKComponentAttributes<any> | undefined>) => {
  return mergePropsReactAria(...props.filter(isProp));
};

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

export { mergeProps, enhanceProps, LKComponentAttributes, LKMouseEvent };
