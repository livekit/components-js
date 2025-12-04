import * as React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';

import { DisconnectButton, DisconnectButtonProps } from '@livekit/components-react';
import { LkRoomContext } from '../../../.storybook/lk-decorators';

const Story: Meta<typeof DisconnectButton> = {
  component: DisconnectButton,
  decorators: [LkRoomContext],
  render: (args: DisconnectButtonProps) => <DisconnectButton {...args}>Leave</DisconnectButton>,
  parameters: {
    actions: {
      handles: ['click'],
    },
  },
};

export default Story;

export const Connected: StoryObj<DisconnectButtonProps> = {
  args: {
    stopTracks: true,
  },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};

export const NotConnected: StoryObj<DisconnectButtonProps> = {
  ...Connected,
  parameters: { roomContext: { ...Connected.parameters, connect: false } },
};
