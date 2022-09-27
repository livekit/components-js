import { participantInfoObserver, setupParticipantName } from '@livekit/components-core';
import { Participant } from 'livekit-client';
import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';
import { useParticipantContext } from '../../contexts';
import { mergeProps, useObservableState } from '../../utils';

export const useParticipantInfo = (participant: Participant) => {
  const infoObserver = useMemo(() => participantInfoObserver(participant), [participant]);
  const { identity, name, metadata } = useObservableState(infoObserver, {
    name: participant.name,
    identity: participant.identity,
    metadata: participant.metadata,
  });

  return { identity, name, metadata };
};

export const ParticipantName = (props: HTMLAttributes<HTMLSpanElement>) => {
  const participant = useParticipantContext();

  const { className, infoObserver } = useMemo(() => {
    console.log('participantName detected participant change', participant.identity);
    return setupParticipantName(participant);
  }, [participant]);

  const { identity, name } = useObservableState(infoObserver, {
    name: participant.name,
    identity: participant.identity,
    metadata: participant.metadata,
  });

  const mergedProps = mergeProps(props, { className });
  return (
    <span {...mergedProps}>
      {name !== '' ? name : identity} {props.children}
    </span>
  );
};
