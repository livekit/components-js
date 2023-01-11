import * as React from 'react';
import { StoryObj } from '@storybook/react';

import { TrackToggle, TrackToggleProps, TrackSource } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: TrackToggle,
  decorators: [LkRoomContext],
  render: (args: TrackToggleProps) => (
    <>
      <TrackToggle {...args}>{`${args.source}`.toUpperCase()} Control</TrackToggle>
      <TrackToggle {...args} />
    </>
  ),
  argTypes: {
    source: {
      options: [TrackSource.Camera, TrackSource.Microphone, TrackSource.ScreenShare],
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

export const Camera: StoryObj<TrackToggleProps> = {
  args: { source: TrackSource.Camera, initialState: true },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const Microphone: StoryObj<TrackToggleProps> = {
  args: { source: TrackSource.Microphone, initialState: true },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};

export const ScreenShare: StoryObj<TrackToggleProps> = {
  args: { source: TrackSource.ScreenShare, initialState: false },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};
