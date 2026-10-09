import { TrackReference, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface TrackLoopProps {
    /** Track references to loop over. You can the use `useTracks()` hook to get TrackReferences. */
    tracks: TrackReference[] | TrackReferenceOrPlaceholder[];
    /** The template component to be used in the loop. */
    children: React.ReactNode;
}
/**
 * The `TrackLoop` component loops over tracks. It is for example a easy way to loop over all participant camera and screen share tracks.
 * `TrackLoop` creates a `TrackRefContext` for each track that you can use to e.g. render the track.
 *
 * @example
 * ```tsx
 * const trackRefs = useTracks([Track.Source.Camera]);
 * <TrackLoop tracks={trackRefs} >
 *  <TrackRefContext.Consumer>
 *    {(trackRef) => trackRef && <VideoTrack trackRef={trackRef}/>}
 *  </TrackRefContext.Consumer>
 * </TrackLoop>
 * ```
 * @public
 */
export declare function TrackLoop({ tracks, ...props }: TrackLoopProps): React.JSX.Element;
//# sourceMappingURL=TrackLoop.d.ts.map