import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface TrackMutedIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
    trackRef: TrackReferenceOrPlaceholder;
    show?: 'always' | 'muted' | 'unmuted';
}
/**
 * The `TrackMutedIndicator` shows whether the participant's camera or microphone is muted or not.
 * By default, a muted/unmuted icon is displayed for a camera, microphone, and screen sharing track.
 *
 * @example
 * ```tsx
 * <TrackMutedIndicator trackRef={trackRef} />
 * ```
 * @public
 */
export declare const TrackMutedIndicator: (props: TrackMutedIndicatorProps & React.RefAttributes<HTMLDivElement>) => React.ReactNode;
//# sourceMappingURL=TrackMutedIndicator.d.ts.map