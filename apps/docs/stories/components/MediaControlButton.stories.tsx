import React from 'react';
import { StoryObj } from '@storybook/react';

import { MediaControlButton, MediaControlProps, TrackSource } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/LkRoomContext';

export default {
  component: MediaControlButton,
  decorators: [LkRoomContext],
  render: (args: MediaControlProps) => (
    <MediaControlButton {...args}>Camera Control</MediaControlButton>
  ),
  argTypes: {
    source: {
      options: [TrackSource.Camera, TrackSource.Microphone, TrackSource.ScreenShare],
      control: { type: 'select' },
    },
  },
  parameters: {
    actions: {
      handles: ['click'],
    },
  },
};

export const Connected: StoryObj<MediaControlProps> = {
  args: { source: TrackSource.Camera, initialState: true },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};

// export const NotConnected: StoryObj<MediaControlProps> = {
//   ...Connected,
//   parameters: { roomContext: { ...Connected.parameters, connect: false } },
// };
