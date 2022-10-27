import React from 'react';
import { StoryObj } from '@storybook/react';

import { MediaControlButton, MediaControlProps, TrackSource } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/LiveKitStorybookContexts';

export default {
  component: MediaControlButton,
  decorators: [LkRoomContext],
  render: (args: MediaControlProps) => (
    <MediaControlButton {...args}>{`${args.source}`.toUpperCase()} Control</MediaControlButton>
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

export const CameraUnmuted: StoryObj<MediaControlProps> = {
  args: { source: TrackSource.Camera, initialState: true },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const CameraMuted: StoryObj<MediaControlProps> = {
  ...CameraUnmuted,
  args: { ...CameraUnmuted.args, initialState: false },
};

export const MicrophoneUnmuted: StoryObj<MediaControlProps> = {
  args: { source: TrackSource.Microphone, initialState: true },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};

export const MicrophoneMuted: StoryObj<MediaControlProps> = {
  ...MicrophoneUnmuted,
  args: { ...MicrophoneUnmuted.args, initialState: false },
};
