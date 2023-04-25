import { participantInfoObserver, setupParticipantName } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../../context';
import { useObservableState } from '../../hooks/internal/useObservableState';
import { mergeProps } from '../../utils';

/** @public */
export function useParticipantInfo(props: UseParticipantInfoOptions = {}) {
  const p = useEnsureParticipant(props.participant);
  const infoObserver = React.useMemo(() => participantInfoObserver(p), [p]);
  const { identity, name, metadata } = useObservableState(infoObserver, {
    name: p.name,
    identity: p.identity,
    metadata: p.metadata,
  });

  return { identity, name, metadata };
}

/** @public */
export type UseParticipantInfoOptions = {
  participant?: Participant;
};

/** @public */
export type ParticipantNameProps = React.HTMLAttributes<HTMLSpanElement> &
  UseParticipantInfoOptions;

/**
 * The ParticipantName component displays the name of the participant as a string within an HTML span element.
 * If no participant name is undefined the participant identity string is displayed.
 *
 * @example
 * ```tsx
 * <ParticipantName />
 * ```
 * @public
 */
export function ParticipantName({ participant, ...props }: ParticipantNameProps) {
  const p = useEnsureParticipant(participant);

  const { className, infoObserver } = React.useMemo(() => {
    return setupParticipantName(p);
  }, [p]);

  const { identity, name } = useObservableState(infoObserver, {
    name: p.name,
    identity: p.identity,
    metadata: p.metadata,
  });

  const mergedProps = React.useMemo(() => {
    return mergeProps(props, { className, 'data-lk-participant-name': name });
  }, [props, className, name]);

  return (
    <span {...mergedProps}>
      {name !== '' ? name : identity}
      {props.children}
    </span>
  );
}
