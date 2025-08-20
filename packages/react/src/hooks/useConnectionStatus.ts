import { useRoomContext } from '../context';
import { useSignal } from './useSignal';

/**
 * The `useConnectionState` hook allows you to simply implement your own `ConnectionState` component.
 *
 * @example
 * ```tsx
 * const connectionState = useConnectionState(room);
 * ```
 * @public
 */
export function useConnectionState() {
  // passed room state takes precedence, if not supplied get current room context
  const ctx = useRoomContext();
  return useSignal(ctx.roomState.state);
}
