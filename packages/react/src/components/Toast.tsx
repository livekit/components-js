import type { Room } from 'livekit-client';
import { ConnectionState } from 'livekit-client';
import * as React from 'react';
import { SpinnerIcon } from '../assets/icons';
import { mergeProps } from '../utils';
import { useConnectionState } from './ConnectionState';

/** @public */
export function Toast(props: React.HTMLAttributes<HTMLDivElement>) {
  const htmlProps = React.useMemo(() => mergeProps(props, { className: 'lk-toast' }), [props]);
  return <div {...htmlProps}>{props.children}</div>;
}

/** @public */
export interface ConnectionStateToastProps extends React.HTMLAttributes<HTMLDivElement> {
  room?: Room;
}

/** @public */
export function ConnectionStateToast(props: ConnectionStateToastProps) {
  const [notification, setNotification] = React.useState<React.ReactElement | undefined>(undefined);
  const state = useConnectionState(props.room);

  React.useEffect(() => {
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
        setNotification(<>Disconnected</>);
        break;
      default:
        setNotification(undefined);
        break;
    }
  }, [state]);
  return notification ? <Toast className="lk-toast-connection-state">{notification}</Toast> : <></>;
}
