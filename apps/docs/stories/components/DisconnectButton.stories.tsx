import React from 'react';
import { ComponentMeta } from '@storybook/react';

import { DisconnectButton, DisconnectButtonProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/LkRoomContext';

export default {
  component: DisconnectButton,
  decorators: [LkRoomContext],
  render: (args) => <DisconnectButton {...args}>Leave</DisconnectButton>,
  parameters: {
    actions: {
      handles: ['click'],
    },
  },
} as ComponentMeta<typeof DisconnectButton>;

export const Connected = {
  stopTracks: true,
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};

export const NotConnected = {
  ...Connected,
  parameters: { roomContext: { ...Connected.parameters, connect: false } },
};
