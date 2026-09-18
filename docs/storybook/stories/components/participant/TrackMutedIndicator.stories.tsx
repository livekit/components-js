import * as React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';

import {
  TrackToggle,
  TrackMutedIndicator,
  TrackMutedIndicatorProps,
} from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../../.storybook/lk-decorators';
import { Track } from 'livekit-client';

const Story: Meta<typeof TrackMutedIndicator> = {
  component: TrackMutedIndicator,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: TrackMutedIndicatorProps) => (
    <>
      <TrackMutedIndicator {...args}></TrackMutedIndicator>
      {args.trackRef && <TrackToggle source={args.trackRef.source}>Toggle Muted</TrackToggle>}
      {/* TODO: Move media control into into LkRoomContext */}
    </>
  ),
  argTypes: {
    trackRef: {
      control: { type: 'select' },
      options: [{ source: Track.Source.Camera }, { source: Track.Source.Microphone }],
      defaultValue: { source: Track.Source.Camera },
    },
  },
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export default Story;

export const Camera: StoryObj<TrackMutedIndicatorProps> = {
  args: { source: Track.Source.Camera },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const Microphone: StoryObj<TrackMutedIndicatorProps> = {
  args: { source: Track.Source.Microphone },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};
