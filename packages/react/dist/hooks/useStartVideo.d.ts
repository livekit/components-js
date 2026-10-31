import { Room } from 'livekit-client';
import * as React from 'react';
/** @alpha */
export interface UseStartVideoProps {
    room?: Room;
    props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}
/**
 * In some browsers to start video playback in low power mode, the user must perform a user-initiated event such as clicking a button.
 * The `useStartVideo` hook returns an object with a boolean `canPlayVideo` flag
 * that indicates whether video playback is allowed in the current context,
 * as well as a `startVideo` function that can be called in a button `onClick` callback to start video playback in the current context.
 *
 * @alpha
 */
export declare function useStartVideo({ room, props }: UseStartVideoProps): {
    mergedProps: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        className: string;
        onClick: () => void;
        style: {
            display: string;
        };
    };
    canPlayVideo: boolean;
};
//# sourceMappingURL=useStartVideo.d.ts.map