import React from 'react';
import { StoryObj } from '@storybook/react';

import { TrackToggle, TrackToggleProps, TrackSource } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: TrackToggle,
  decorators: [LkRoomContext],
  render: (args: TrackToggleProps) => (
    <TrackToggle {...args}>{`${args.source}`.toUpperCase()} Control</TrackToggle>
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

export const CameraUnmuted: StoryObj<TrackToggleProps> = {
  args: { source: TrackSource.Camera, initialState: true },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const CameraMuted: StoryObj<TrackToggleProps> = {
  ...CameraUnmuted,
  args: { ...CameraUnmuted.args, initialState: false },
};

export const MicrophoneUnmuted: StoryObj<TrackToggleProps> = {
  args: { source: TrackSource.Microphone, initialState: true },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};

export const MicrophoneMuted: StoryObj<TrackToggleProps> = {
  ...MicrophoneUnmuted,
  args: { ...MicrophoneUnmuted.args, initialState: false },
};
