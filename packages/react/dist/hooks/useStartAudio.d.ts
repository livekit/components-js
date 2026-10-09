import { Room } from 'livekit-client';
import * as React from 'react';
/** @alpha */
export interface UseStartAudioProps {
    room?: Room;
    props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}
/**
 * In many browsers to start audio playback, the user must perform a user-initiated event such as clicking a button.
 * The `useStatAudio` hook returns an object with a boolean `canPlayAudio` flag
 * that indicates whether audio playback is allowed in the current context,
 * as well as a `startAudio` function that can be called in a button `onClick` callback to start audio playback in the current context.
 *
 * @see Autoplay policy on MDN web docs for more info: {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy}
 * @alpha
 */
export declare function useStartAudio({ room, props }: UseStartAudioProps): {
    mergedProps: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        className: string;
        onClick: () => void;
        style: {
            display: string;
        };
    };
    canPlayAudio: boolean;
};
//# sourceMappingURL=useStartAudio.d.ts.map