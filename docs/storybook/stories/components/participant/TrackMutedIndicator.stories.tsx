import * as React from 'react';
import { StoryObj } from '@storybook/react';

import {
  TrackToggle,
  TrackMutedIndicator,
  TrackMutedIndicatorProps,
} from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../../.storybook/lk-decorators';
import { Track } from 'livekit-client';

export default {
  component: TrackMutedIndicator,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: TrackMutedIndicatorProps) => (
    <>
      <TrackMutedIndicator {...args}></TrackMutedIndicator>
      <TrackToggle source={args.source}>Toggle Muted</TrackToggle>
      {/* TODO: Move media control into into LkRoomContext */}
    </>
  ),
  argTypes: {
    source: {
      control: { type: 'select' },
      options: [Track.Source.Camera, Track.Source.Microphone],
    },
  },
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Camera: StoryObj<TrackMutedIndicatorProps> = {
  args: { source: Track.Source.Camera },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const Microphone: StoryObj<TrackMutedIndicatorProps> = {
  args: { source: Track.Source.Microphone },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};
