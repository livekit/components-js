import { ParticipantClickEvent, TrackReference } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface VideoTrackProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    /** The track reference of the track to render. */
    trackRef?: TrackReference;
    onTrackClick?: (evt: ParticipantClickEvent) => void;
    onSubscriptionStatusChanged?: (subscribed: boolean) => void;
    manageSubscription?: boolean;
}
/**
 * The `VideoTrack` component is responsible for rendering participant video tracks like `camera` and `screen_share`.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * @example
 * ```tsx
 * <VideoTrack trackRef={trackRef} />
 * ```
 * @see {@link @livekit/components-react#ParticipantTile | ParticipantTile}
 * @public
 */
export declare const VideoTrack: (props: VideoTrackProps & React.RefAttributes<HTMLVideoElement>) => React.ReactNode;
//# sourceMappingURL=VideoTrack.d.ts.map