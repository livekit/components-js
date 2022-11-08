import { participantInfoObserver, setupParticipantName } from '@livekit/components-core';
import { Participant } from 'livekit-client';
import * as React from 'react';
import { useParticipantContext } from '../../contexts';
import { mergeProps, useObservableState } from '../../utils';

export const useParticipantInfo = (participant: Participant) => {
  const infoObserver = React.useMemo(() => participantInfoObserver(participant), [participant]);
  const { identity, name, metadata } = useObservableState(infoObserver, {
    name: participant.name,
    identity: participant.identity,
    metadata: participant.metadata,
  });

  return { identity, name, metadata };
};
export interface ParticipantNameProps extends React.HTMLAttributes<HTMLSpanElement> {}
export const ParticipantName = ({ ...props }: ParticipantNameProps) => {
  const participant = useParticipantContext();

  const { className, infoObserver } = React.useMemo(() => {
    return setupParticipantName(participant);
  }, [participant]);

  const { identity, name } = useObservableState(infoObserver, {
    name: participant.name,
    identity: participant.identity,
    metadata: participant.metadata,
  });

  const mergedProps = React.useMemo(() => {
    return mergeProps(props, { className, 'data-lk-participant-name': name });
  }, [props, className, name]);

  return (
    <span {...mergedProps}>
      {name !== '' ? name : identity} {props.children}
    </span>
  );
};
