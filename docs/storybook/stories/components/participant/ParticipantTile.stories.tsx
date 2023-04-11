import { ParticipantTile, ParticipantTileProps } from '@livekit/components-react';
import { StoryObj } from '@storybook/react';
import { Track } from 'livekit-client';
import * as React from 'react';
import { LkParticipantContext, LkRoomContext } from '../../../.storybook/lk-decorators';

export default {
  component: ParticipantTile,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: ParticipantTileProps) => <ParticipantTile {...args}></ParticipantTile>,
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

export const Default: StoryObj<ParticipantTileProps> = {
  args: { trackSource: Track.Source.Camera },
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
