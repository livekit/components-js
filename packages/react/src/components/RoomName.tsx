import * as React from 'react';
import { useRoomInfo } from '../hooks';

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
 */
export const RoomName = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, RoomNameProps>(
  function RoomName(
    { childrenPosition = 'before', children, ...htmlAttributes }: RoomNameProps,
    ref,
  ) {
    const { name } = useRoomInfo();

    return (
      <span ref={ref} {...htmlAttributes}>
        {childrenPosition === 'before' && children}
        {name}
        {childrenPosition === 'after' && children}
      </span>
    );
  },
);
