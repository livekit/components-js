import * as React from 'react';
import { useRoomInfo } from '../hooks';

/** @public */
export interface RoomNameProps extends React.HTMLAttributes<HTMLSpanElement> {
  childrenPosition?: 'before' | 'after';
}

/**
 * The RoomName component renders the name of the connected LiveKit room inside a span tag.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <RoomName />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function RoomName({
  childrenPosition = 'before',
  children,
  ...htmlAttributes
}: RoomNameProps) {
  const { name } = useRoomInfo();

  return (
    <span {...htmlAttributes}>
      {childrenPosition === 'before' && children}
      {name}
      {childrenPosition === 'after' && children}
    </span>
  );
}
