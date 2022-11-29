import React from 'react';
import { Participants } from '@livekit/components-react';
import { Decorator } from '@storybook/react';

/**
 * Wraps a Storybook Story into a LiveKit participant context.
 *
 * Note: When used as a Storybook decorator, this component has to be used in combination with LkRoomContext.
 * The decorator order matters: `decorators: [LkParticipantContext, LkRoomContext]`
 */
export const LkParticipantContext: Decorator = (Story, _) => {
  return <Participants>{Story()}</Participants>;
};
