import { Room } from 'livekit-client';
import { HTMLAttributes } from 'react';
import { LiveKitRoomProps } from '../components';
/**
 * The `useLiveKitRoom` hook is used to implement the `LiveKitRoom` or your custom implementation of it.
 * It returns a `Room` instance and HTML props that should be applied to the root element of the component.
 *
 * @example
 * ```tsx
 * const { room, htmlProps } = useLiveKitRoom();
 * return <div {...htmlProps}>...</div>;
 * ```
 * @public
 */
export declare function useLiveKitRoom<T extends HTMLElement>(props: LiveKitRoomProps): {
    room: Room | undefined;
    htmlProps: HTMLAttributes<T>;
};
//# sourceMappingURL=useLiveKitRoom.d.ts.map