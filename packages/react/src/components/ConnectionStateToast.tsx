import type { Room } from 'livekit-client';
import { ConnectionState } from 'livekit-client';
import * as React from 'react';
import { SpinnerIcon } from '../assets/icons';
import { useConnectionState, usePrevValue } from '../hooks';
import { Toast } from './Toast';

/** @public */
export interface ConnectionStateToastProps extends React.HTMLAttributes<HTMLDivElement> {
  room?: Room;
}

/**
 * The `ConnectionStateToast` component displays a toast
 * notification indicating the current connection state of the room.
 * @public
 */
export function ConnectionStateToast(props: ConnectionStateToastProps) {
  const [notification, setNotification] = React.useState<React.ReactElement | undefined>(undefined);
  const state = useConnectionState(props.room);
  const prevState = usePrevValue(state);

  React.useEffect(() => {
    if (state === prevState) {
      return;
    }
    switch (state) {
      case ConnectionState.Reconnecting:
        setNotification(
          <>
            <SpinnerIcon className="lk-spinner" /> Reconnecting
          </>,
        );
        break;
      case ConnectionState.Connecting:
        setNotification(
          <>
            <SpinnerIcon className="lk-spinner" /> Connecting
          </>,
        );
        break;
      case ConnectionState.Disconnected:
        if (prevState === undefined) {
          break;
        }
        setNotification(<>Disconnected</>);
        break;
      default:
        setNotification(undefined);
        break;
    }
  }, [state, prevState]);
  return notification ? <Toast className="lk-toast-connection-state">{notification}</Toast> : <></>;
}
