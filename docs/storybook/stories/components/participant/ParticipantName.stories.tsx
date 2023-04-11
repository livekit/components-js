import * as React from 'react';
import { StoryObj } from '@storybook/react';

import { ParticipantName, ParticipantNameProps } from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../../.storybook/lk-decorators';

export default {
  component: ParticipantName,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: ParticipantNameProps) => <ParticipantName {...args}></ParticipantName>,
  argTypes: {},
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<ParticipantNameProps> = {
  args: {},
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};
