import { TrackReferenceOrPlaceholder, ParticipantClickEvent } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
}
/**
 * The `FocusLayoutContainer` is a layout component that expects two children:
 * A small side component: In a video conference, this is usually a carousel of participants
 * who are not in focus. And a larger main component to display the focused participant.
 * For example, with the `FocusLayout` component.
 *  @public
 */
export declare function FocusLayoutContainer(props: FocusLayoutContainerProps): React.JSX.Element;
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
export declare function FocusLayout({ trackRef, ...htmlProps }: FocusLayoutProps): React.JSX.Element;
//# sourceMappingURL=FocusLayout.d.ts.map