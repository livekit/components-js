import React from 'react';
import { StoryObj } from '@storybook/react';

import { ParticipantView, ParticipantViewProps } from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../.storybook/lk-decorators';
import { Track } from 'livekit-client';

export default {
  component: ParticipantView,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: ParticipantViewProps) => <ParticipantView {...args}></ParticipantView>,
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

export const Default: StoryObj<ParticipantViewProps> = {
  args: { trackSource: Track.Source.Camera },
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
