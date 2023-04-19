import type { Participant } from 'livekit-client';
import * as React from 'react';
import { mergeProps } from '../../utils';
import type { TrackReference, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { ParticipantTile } from '../participant/ParticipantTile';
import type { ParticipantClickEvent } from '@livekit/components-core';

export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  focusTrack?: TrackReference;
  participants?: Array<Participant>;
}

export function FocusLayoutContainer(props: FocusLayoutContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-focus-layout' });

  return <div {...elementProps}>{props.children}</div>;
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  track?: TrackReferenceOrPlaceholder;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayout({ track, ...htmlProps }: FocusLayoutProps) {
  return <ParticipantTile {...track} {...htmlProps} />;
}
