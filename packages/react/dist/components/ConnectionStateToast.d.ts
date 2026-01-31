import { Room } from 'livekit-client';
import * as React from 'react';
/** @public */
export interface ConnectionStateToastProps extends React.HTMLAttributes<HTMLDivElement> {
    room?: Room;
}
/**
 * The `ConnectionStateToast` component displays a toast
 * notification indicating the current connection state of the room.
 * @public
 */
export declare function ConnectionStateToast(props: ConnectionStateToastProps): React.JSX.Element;
//# sourceMappingURL=ConnectionStateToast.d.ts.map