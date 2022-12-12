import React from 'react';
import { StoryObj } from '@storybook/react';

import { MediaDeviceSelect, MediaDeviceSelectProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

const kinds: MediaDeviceKind[] = ['audioinput', 'audiooutput', 'videoinput'];

export default {
  name: 'MediaDeviceSelect',
  component: MediaDeviceSelect,
  decorators: [LkRoomContext],
  render: (args: MediaDeviceSelectProps) => (
    <MediaDeviceSelect {...args}>{args.kind} </MediaDeviceSelect>
  ),
  argTypes: {
    onActiveDeviceChange: { type: 'function' },
    kind: {
      options: kinds,
      control: { type: 'select' },
    },
  },
  parameters: {
    actions: {
      handles: ['click button'],
    },
  },
};

export const AudioInputDevices: StoryObj<MediaDeviceSelectProps> = {
  args: { kind: 'audioinput' },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};

export const VideoInputDevices: StoryObj<MediaDeviceSelectProps> = {
  args: { kind: 'videoinput' },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const AudioOutputDevices: StoryObj<MediaDeviceSelectProps> = {
  args: { kind: 'audiooutput' },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};
