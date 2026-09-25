import * as React from 'react';
/** @public */
export interface RoomNameProps extends React.HTMLAttributes<HTMLSpanElement> {
    childrenPosition?: 'before' | 'after';
}
/**
 * The `RoomName` component renders the name of the connected LiveKit room inside a span tag.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <RoomName />
 * </LiveKitRoom>
 * ```
 * @public
 *
 * @param props - RoomNameProps
 */
export declare const RoomName: React.FC<RoomNameProps & React.RefAttributes<HTMLSpanElement>>;
//# sourceMappingURL=RoomName.d.ts.map