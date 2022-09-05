import { participantInfoObserver } from '@livekit/components-core';
import { Participant } from 'livekit-client';
import React, { HTMLAttributes, useCallback, useEffect, useState } from 'react';
import { useParticipantContext } from '../contexts';

export const useParticipantInfo = (participant: Participant) => {
  const [identity, setIdentity] = useState(participant.identity);
  const [name, setName] = useState(participant.name);
  const [metadata, setMetadata] = useState(participant.metadata);

  const handleUpdate = useCallback(
    (p: Participant) => {
      console.log('participant info update', p);
      setIdentity(p.identity);
      setName(p.name);
      setMetadata(p.metadata);
    },
    [participant],
  );

  useEffect(() => {
    const listener = participantInfoObserver(participant, handleUpdate);
    return listener.unsubscribe();
  });

  return { identity, name, metadata };
};

export const ParticipantName = (props: HTMLAttributes<HTMLSpanElement>) => {
  const participant = useParticipantContext();
  const { name, identity } = useParticipantInfo(participant);
  return (
    <span {...props}>
      {name !== '' ? name : identity} {props.children}
    </span>
  );
};
