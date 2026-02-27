import { Room } from 'livekit-client';
import * as React from 'react';
/** @public */
export interface AllowAudioPlaybackProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    room?: Room;
    label?: string;
}
/**
 * The `StartAudio` component is only visible when the browser blocks audio playback. This is due to some browser implemented autoplay policies.
 * To start audio playback, the user must perform a user-initiated event such as clicking this button.
 * As soon as audio playback starts, the button hides itself again.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <StartAudio label="Click to allow audio playback" />
 * </LiveKitRoom>
 * ```
 *
 * @see Autoplay policy on MDN web docs: {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy}
 * @public
 */
export declare const StartAudio: (props: AllowAudioPlaybackProps & React.RefAttributes<HTMLButtonElement>) => React.ReactNode;
//# sourceMappingURL=StartAudio.d.ts.map