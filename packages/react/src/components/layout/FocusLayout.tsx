import * as React from 'react';
import { mergeProps } from '../../utils';
import type { TrackReferenceOrPlaceholder } from '@cc-livekit/components-core';
import { ParticipantTile } from '../participant/ParticipantTile';
import type { ParticipantClickEvent } from '@cc-livekit/components-core';
import { useFeatureContext } from '../../context';
import { RoomEvent, Track } from 'livekit-client';
import { useTracks } from '../../hooks';

/** @public */
export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * The `FocusLayoutContainer` is a layout component that expects two children:
 * A small side component: In a video conference, this is usually a carousel of participants
 * who are not in focus. And a larger main component to display the focused participant.
 * For example, with the `FocusLayout` component.
 *  @public
 */
export function FocusLayoutContainer(props: FocusLayoutContainerProps) {
  const featureFlags = useFeatureContext();
  const tracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }], {
    updateOnlyOn: [RoomEvent.ActiveSpeakersChanged],
    onlySubscribed: false,
  });
  const isSharingScreen = tracks.some((track) => track.source === Track.Source.ScreenShare);

  const elementProps = mergeProps(props, {
    className: `lk-focus-layout ${!isSharingScreen && featureFlags?.type === '1on1' ? 'adapt-1on1-call' : ''}`,
  });

  return <div {...elementProps}>{props.children}</div>;
}

/** @public */
export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  /** The track to display in the focus layout. */
  trackRef?: TrackReferenceOrPlaceholder;

  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

/**
 * The `FocusLayout` component is just a light wrapper around the `ParticipantTile` to display a single participant.
 * @public
 */
export function FocusLayout({ trackRef, ...htmlProps }: FocusLayoutProps) {
  return <ParticipantTile trackRef={trackRef} {...htmlProps} />;
}
