import React from 'react';
import { StoryObj } from '@storybook/react';

import { DeviceSelector, DeviceSelectorProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/LiveKitStorybookContexts';

const kinds: MediaDeviceKind[] = ['audioinput', 'audiooutput', 'videoinput'];

export default {
  name: 'DeviceSelector',
  component: DeviceSelector,
  decorators: [LkRoomContext],
  render: (args: DeviceSelectorProps) => <DeviceSelector {...args}>{args.kind} </DeviceSelector>,
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

export const AudioInputDevices: StoryObj<DeviceSelectorProps> = {
  args: { kind: 'audioinput' },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};

export const VideoInputDevices: StoryObj<DeviceSelectorProps> = {
  args: { kind: 'videoinput' },
  parameters: { roomContext: { audio: false, video: true, connect: true } },
};

export const AudioOutputDevices: StoryObj<DeviceSelectorProps> = {
  args: { kind: 'audiooutput' },
  parameters: { roomContext: { audio: true, video: false, connect: true } },
};
