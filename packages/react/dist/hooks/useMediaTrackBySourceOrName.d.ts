import { TrackIdentifier } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface UseMediaTrackOptions {
    element?: React.RefObject<HTMLMediaElement> | null;
    props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}
/**
 * @internal
 */
export declare function useMediaTrackBySourceOrName(observerOptions: TrackIdentifier, options?: UseMediaTrackOptions): {
    publication: import('livekit-client').TrackPublication | undefined;
    isMuted: boolean | undefined;
    isSubscribed: boolean | undefined;
    track: import('livekit-client').Track<import("livekit-client").Track.Kind> | undefined;
    elementProps: React.HTMLAttributes<HTMLElement>;
};
//# sourceMappingURL=useMediaTrackBySourceOrName.d.ts.map