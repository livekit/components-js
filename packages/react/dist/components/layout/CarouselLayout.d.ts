import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface CarouselLayoutProps extends React.HTMLAttributes<HTMLMediaElement> {
    tracks: TrackReferenceOrPlaceholder[];
    children: React.ReactNode;
    /** Place the tiles vertically or horizontally next to each other.
     * If undefined orientation is guessed by the dimensions of the container. */
    orientation?: 'vertical' | 'horizontal';
}
/**
 * The `CarouselLayout` component displays a list of tracks in a scroll container.
 * It will display as many tiles as possible and overflow the rest.
 * @remarks
 * To ensure visual stability when tiles are reordered due to track updates,
 * the component uses the `useVisualStableUpdate` hook.
 * @example
 * ```tsx
 * const tracks = useTracks([Track.Source.Camera]);
 * <CarouselLayout tracks={tracks}>
 *   <ParticipantTile />
 * </CarouselLayout>
 * ```
 * @public
 */
export declare function CarouselLayout({ tracks, orientation, ...props }: CarouselLayoutProps): React.JSX.Element;
//# sourceMappingURL=CarouselLayout.d.ts.map