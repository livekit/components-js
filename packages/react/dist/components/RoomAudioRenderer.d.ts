import { Room } from 'livekit-client';
import * as React from 'react';
/** @public */
export interface RoomAudioRendererProps {
    room?: Room;
    /** Sets the volume for all audio tracks rendered by this component. By default, the range is between `0.0` and `1.0`. */
    volume?: number;
    /**
     * If set to `true`, mutes all audio tracks rendered by the component.
     * @remarks
     * If set to `true`, the server will stop sending audio track data to the client.
     * @alpha
     */
    muted?: boolean;
}
/**
 * The `RoomAudioRenderer` component is a drop-in solution for adding audio to your LiveKit app.
 * It takes care of handling remote participants’ audio tracks and makes sure that microphones and screen share are audible.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <RoomAudioRenderer />
 * </LiveKitRoom>
 * ```
 * @public
 */
export declare function RoomAudioRenderer({ room, volume, muted }: RoomAudioRendererProps): React.JSX.Element;
//# sourceMappingURL=RoomAudioRenderer.d.ts.map