import React from 'react';
import { StoryObj } from '@storybook/react';

import {
  MediaControlButton,
  MediaMutedIndicator,
  MediaMutedIndicatorProps,
} from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../.storybook/LiveKitStorybookContexts';
import { Track } from 'livekit-client';

export default {
  component: MediaMutedIndicator,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: MediaMutedIndicatorProps) => (
    <>
      <MediaMutedIndicator {...args}></MediaMutedIndicator>
      <MediaControlButton source={args.source}>Toggle Muted</MediaControlButton>
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

export const Camera: StoryObj<MediaMutedIndicatorProps> = {
  args: { source: Track.Source.Camera },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const Microphone: StoryObj<MediaMutedIndicatorProps> = {
  args: { source: Track.Source.Microphone },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};
