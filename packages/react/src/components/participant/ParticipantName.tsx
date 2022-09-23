import { participantInfoObserver, setupParticipantName } from '@livekit/components-core';
import { Participant } from 'livekit-client';
import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';
import { useParticipantContext } from '../../contexts';
import { mergeProps } from '../../utils';

export const useParticipantInfo = (participant: Participant) => {
  const [identity, setIdentity] = useState(participant.identity);
  const [name, setName] = useState(participant.name);
  const [metadata, setMetadata] = useState(participant.metadata);

  const handleUpdate = useCallback(
    (info: { name?: string; identity: string; metadata?: string }) => {
      setIdentity(info.identity);
      setName(info.name);
      setMetadata(info.metadata);
    },
    [participant],
  );

  useEffect(() => {
    const listener = participantInfoObserver(participant).subscribe(handleUpdate);
    return listener.unsubscribe();
  });

  return { identity, name, metadata };
};

export const ParticipantName = (props: HTMLAttributes<HTMLSpanElement>) => {
  const participant = useParticipantContext();
  const [name, setName] = useState(participant.name);
  const [identity, setIdentity] = useState(participant.identity);

  const { className, infoObserver } = useMemo(
    () => setupParticipantName(participant),
    [participant],
  );

  useEffect(() => {
    const subscription = infoObserver.subscribe(({ name, identity }) => {
      setName(name);
      setIdentity(identity);
    });
    return () => subscription.unsubscribe();
  });
  const mergedProps = mergeProps(props, { className });
  return (
    <span {...mergedProps}>
      {name !== '' ? name : identity} {props.children}
    </span>
  );
};
