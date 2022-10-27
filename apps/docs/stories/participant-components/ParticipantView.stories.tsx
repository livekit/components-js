import React from 'react';
import { StoryObj } from '@storybook/react';

import { ParticipantView, ParticipantProps } from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../.storybook/LiveKitStorybookContexts';
import { Track } from 'livekit-client';

export default {
  component: ParticipantView,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: ParticipantProps) => <ParticipantView {...args}></ParticipantView>,
  argTypes: {
    trackSource: {
      control: { type: 'select' },
      options: [Track.Source.Camera, Track.Source.ScreenShare],
    },
  },
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<ParticipantProps> = {
  args: { trackSource: Track.Source.Camera },
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
