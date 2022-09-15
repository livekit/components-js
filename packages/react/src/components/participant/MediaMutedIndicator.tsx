import React, { HTMLAttributes, HtmlHTMLAttributes } from 'react';
import { mergeProps } from '../../utils';
// import { useParticipantContext } from '../contexts';
import { MediaMutedIndicatorInterface } from '@livekit/components-core';

interface MediaMutedIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  kind: 'audio' | 'video';
}

export const useMediaMutedIndicator = (
  kind: MediaMutedIndicatorProps['kind'],
  props: HtmlHTMLAttributes<HTMLDivElement>,
): { mergedProps: HTMLAttributes<HTMLDivElement> } => {
  // const participant = useParticipantContext();
  const { className } = MediaMutedIndicatorInterface.setup(kind);
  const mergedProps = mergeProps(props, {
    className,
  });
  return { mergedProps };
};

export const MediaMutedIndicator = ({ kind, ...props }: MediaMutedIndicatorProps) => {
  const { mergedProps } = useMediaMutedIndicator(kind, props);

  return <div {...mergedProps}>{props.children}</div>;
};
