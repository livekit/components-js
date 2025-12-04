import { ParticipantTile, ParticipantTileProps } from '@livekit/components-react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { Track } from 'livekit-client';
import * as React from 'react';
import { LkParticipantContext, LkRoomContext } from '../../../.storybook/lk-decorators';

const Story: Meta<typeof ParticipantTile> = {
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
export default Story;
export const Default: StoryObj<ParticipantTileProps> = {
  args: { trackSource: Track.Source.Camera },
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
