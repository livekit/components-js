import React from 'react';
import { StoryObj } from '@storybook/react';

import { DisconnectButton, DisconnectButtonProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/LiveKitStorybookContexts';

export default {
  component: DisconnectButton,
  decorators: [LkRoomContext],
  render: (args: DisconnectButtonProps) => <DisconnectButton {...args}>Leave</DisconnectButton>,
  parameters: {
    actions: {
      handles: ['click'],
    },
  },
};

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
