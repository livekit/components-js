import { ParticipantContext } from '@livekit/components-react';
import { ConnectionQuality, Participant, ParticipantEvent } from 'livekit-client';
import React, { useEffect, useState } from 'react';

export interface MockParticipantProps {
  children: React.ReactNode;
  name?: string;
  metadata?: string;
  identity: string;
  sid: string;
  connectionQuality?: ConnectionQuality;
}

export const MockParticipantContext = ({ children, ...props }: MockParticipantProps) => {
  const [dummyParticipant] = useState(
    new Participant(props.sid, props.identity, props.name, props.metadata),
  );
  useEffect(() => {
    if (!props.connectionQuality) return;

    dummyParticipant.emit(ParticipantEvent.ConnectionQualityChanged, props.connectionQuality);
    console.log('updating quality', props.connectionQuality);
  }, [props.connectionQuality, dummyParticipant]);
  console.log({ dummyParticipant });
  return (
    <>
      <ParticipantContext.Provider value={dummyParticipant}>{children}</ParticipantContext.Provider>
    </>
  );
};
