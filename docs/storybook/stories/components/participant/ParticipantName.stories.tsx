import * as React from 'react';
import { StoryObj, Meta } from '@storybook/react-vite';

import { ParticipantName, ParticipantNameProps } from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../../.storybook/lk-decorators';

const Story: Meta<typeof ParticipantName> = {
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

export default Story;

export const Default: StoryObj<ParticipantNameProps> = {
  args: {},
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};
