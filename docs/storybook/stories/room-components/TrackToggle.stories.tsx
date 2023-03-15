import * as React from 'react';
import { StoryObj } from '@storybook/react';

import { TrackToggle, TrackToggleProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';
import { Track } from 'livekit-client';

export default {
  component: TrackToggle,
  decorators: [LkRoomContext],
  render: (args: TrackToggleProps<Track.Source>) => (
    <>
      <TrackToggle {...args}>{`${args.source}`.toUpperCase()} Control</TrackToggle>
      <TrackToggle {...args} />
    </>
  ),
  argTypes: {
    source: {
      options: [Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare],
      control: { type: 'select' },
    },
    onChange: { action: 'onchange' },
  },
  parameters: {
    actions: {
      handles: ['mouseover button', 'click button'],
    },
  },
};

export const Camera: StoryObj<TrackToggleProps<Track.Source.Camera>> = {
  args: { source: Track.Source.Camera, initialState: true },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const Microphone: StoryObj<TrackToggleProps<Track.Source.Microphone>> = {
  args: { source: Track.Source.Microphone, initialState: true },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};

export const ScreenShare: StoryObj<TrackToggleProps<Track.Source.ScreenShare>> = {
  args: { source: Track.Source.ScreenShare, initialState: false },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};
