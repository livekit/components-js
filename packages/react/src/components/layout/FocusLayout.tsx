import type { Participant } from 'livekit-client';
import * as React from 'react';
import { mergeProps } from '../../utils';
import type { TrackReference, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { ParticipantTile } from '../participant/ParticipantTile';
import type { ParticipantClickEvent } from '@livekit/components-core';

/** @public */
export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @deprecated This property has no effect and will be removed in a future version. */
  focusTrack?: TrackReference;
  /** @deprecated This property has no effect and will be removed in a future version. */
  participants?: Array<Participant>;
}

/** @public */
export function FocusLayoutContainer(props: FocusLayoutContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-focus-layout' });

  return <div {...elementProps}>{props.children}</div>;
}

/** @public */
export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  /** The track to display in the focus layout. */
  trackRef?: TrackReferenceOrPlaceholder;
  /** @deprecated This property will be removed in a future version use `trackRef` instead. */
  track?: TrackReferenceOrPlaceholder;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

/** @public */
export function FocusLayout({ trackRef, track, ...htmlProps }: FocusLayoutProps) {
  const trackReference = trackRef ?? track;
  return <ParticipantTile {...trackReference} {...htmlProps} />;
}
