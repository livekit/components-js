import * as React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';

import { MediaDeviceSelect, MediaDeviceSelectProps } from '@livekit/components-react';
import { LkRoomContext } from '../../../.storybook/lk-decorators';

const kinds: MediaDeviceKind[] = ['audioinput', 'audiooutput', 'videoinput'];

const Story: Meta<typeof MediaDeviceSelect> = {
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

export default Story;

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
