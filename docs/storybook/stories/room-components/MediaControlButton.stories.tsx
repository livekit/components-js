import React from 'react';
import { StoryObj } from '@storybook/react';

import { TrackToggle, MediaControlButtonProps, TrackSource } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  component: TrackToggle,
  decorators: [LkRoomContext],
  render: (args: MediaControlButtonProps) => (
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

export const CameraUnmuted: StoryObj<MediaControlButtonProps> = {
  args: { source: TrackSource.Camera, initialState: true },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const CameraMuted: StoryObj<MediaControlButtonProps> = {
  ...CameraUnmuted,
  args: { ...CameraUnmuted.args, initialState: false },
};

export const MicrophoneUnmuted: StoryObj<MediaControlButtonProps> = {
  args: { source: TrackSource.Microphone, initialState: true },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};

export const MicrophoneMuted: StoryObj<MediaControlButtonProps> = {
  ...MicrophoneUnmuted,
  args: { ...MicrophoneUnmuted.args, initialState: false },
};
