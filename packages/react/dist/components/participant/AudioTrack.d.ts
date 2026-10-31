import { TrackReference } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface AudioTrackProps extends React.AudioHTMLAttributes<HTMLAudioElement> {
    /** The track reference of the track from which the audio is to be rendered. */
    trackRef?: TrackReference;
    onSubscriptionStatusChanged?: (subscribed: boolean) => void;
    /** Sets the volume of the audio track. By default, the range is between `0.0` and `1.0`. */
    volume?: number;
    /**
     * Mutes the audio track if set to `true`.
     * @remarks
     * If set to `true`, the server will stop sending audio track data to the client.
     * @alpha
     */
    muted?: boolean;
}
/**
 * The AudioTrack component is responsible for rendering participant audio tracks.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * @example
 * ```tsx
 *   <ParticipantTile>
 *     <AudioTrack trackRef={trackRef} />
 *   </ParticipantTile>
 * ```
 *
 * @see `ParticipantTile` component
 * @public
 */
export declare const AudioTrack: (props: AudioTrackProps & React.RefAttributes<HTMLAudioElement>) => React.ReactNode;
//# sourceMappingURL=AudioTrack.d.ts.map