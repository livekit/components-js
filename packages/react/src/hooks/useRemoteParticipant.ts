import {
  type ParticipantIdentifier,
  connectedParticipantObserver,
  participantByIdentifierObserver,
} from '@livekit/components-core';
import type { ParticipantEvent, RemoteParticipant } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../context';

/** @public */
export interface UseRemoteParticipantOptions {
  /**
   * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
   * By default it updates on all relevant ParticipantEvents to keep the returned participant up to date.
   */
  updateOnlyOn?: ParticipantEvent[];
}

/**
 * The `useRemoteParticipant` hook returns the first RemoteParticipant by either identity and/or based on the participant kind.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participant = useRemoteParticipant({kind: ParticipantKind.Agent, identity: 'myAgent'});
 * ```
 * @public
 */
export function useRemoteParticipant(
  identifier: ParticipantIdentifier,
  options?: UseRemoteParticipantOptions,
): RemoteParticipant | undefined;
/**
 * The `useRemoteParticipant` hook returns the first RemoteParticipant by either identity or based on the participant kind.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participant = useRemoteParticipant('Russ');
 * ```
 * @public
 */
export function useRemoteParticipant(
  identity: string,
  options?: UseRemoteParticipantOptions,
): RemoteParticipant | undefined;
export function useRemoteParticipant(
  identityOrIdentifier: string | ParticipantIdentifier,
  options: UseRemoteParticipantOptions = {},
): RemoteParticipant | undefined {
  const room = useRoomContext();
  const [updateOnlyOn] = React.useState(options.updateOnlyOn);

  const observable = React.useMemo(() => {
    if (typeof identityOrIdentifier === 'string') {
      return connectedParticipantObserver(room, identityOrIdentifier, {
        additionalEvents: updateOnlyOn,
      });
    } else {
      return participantByIdentifierObserver(room, identityOrIdentifier, {
        additionalEvents: updateOnlyOn,
      });
    }
  }, [room, JSON.stringify(identityOrIdentifier), updateOnlyOn]);

  // Using `wrapperParticipant` to ensure a new object reference,
  // triggering a re-render when the participant events fire.
  const [participantWrapper, setParticipantWrapper] = React.useState({
    p: undefined as RemoteParticipant | undefined,
  });
  React.useEffect(() => {
    const listener = observable.subscribe((p) => setParticipantWrapper({ p }));
    return () => listener.unsubscribe();
  }, [observable]);

  return participantWrapper.p;
}
