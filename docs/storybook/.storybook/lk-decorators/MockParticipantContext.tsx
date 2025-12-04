import { ParticipantContext } from '@livekit/components-react';
import { Decorator } from '@storybook/react-vite';
import { ConnectionQuality, Participant, ParticipantEvent } from 'livekit-client';
import * as React from 'react';

/**
 * Collection of static settings to provide to the mock context.
 */
export type MockParticipantParameter = {
  name?: string;
  metadata?: string;
  identity: string;
  sid: string;
};

/**
 * Collection of dynamic values that update the mock context.
 */
export type MockParticipantProps = {
  connectionQuality: ConnectionQuality;
};

/**
 * A convenience constant with default parameter for the MockParticipantContext.
 */
export const DEFAULT_MOCK_PARTICIPANT_PARAMETER: MockParticipantParameter = {
  name: 'Default Mock Name',
  metadata: 'default mock metadata',
  identity: 'my-mock-id',
  sid: '123456789',
};

export const MockParticipantContext: Decorator = (Story, args) => {
  const config: MockParticipantParameter =
    args.parameters.mockParticipantContext ?? DEFAULT_MOCK_PARTICIPANT_PARAMETER;
  const props: Partial<MockParticipantProps> = args.args;

  const [dummyParticipant] = React.useState(
    new Participant(config.sid, config.identity, config.name, config.metadata),
  );
  React.useEffect(() => {
    if (!props.connectionQuality) return;
    dummyParticipant.emit(ParticipantEvent.ConnectionQualityChanged, props.connectionQuality);
  }, [props, dummyParticipant]);
  return (
    <ParticipantContext.Provider value={dummyParticipant}>{Story()}</ParticipantContext.Provider>
  );
};
