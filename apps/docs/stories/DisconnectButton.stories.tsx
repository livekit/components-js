import React from 'react';

import { ComponentMeta } from '@storybook/react';

import { DisconnectButton } from '@livekit/components-react';
import { LkRoomContext, RoomContextSettings } from '../.storybook/LkRoomContext';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Component/DisconnectButton',
  component: DisconnectButton,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  decorators: [LkRoomContext],

  parameters: {
    actions: {
      handles: ['click'],
    },
  },
} as ComponentMeta<typeof DisconnectButton>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template = (args: typeof DisconnectButton) => <DisconnectButton>Leave</DisconnectButton>;

export const Connected = Template.bind({ stopTracks: true });
Connected.parameters = {
  roomContext: { audio: false, video: false, connect: true },
};

export const NotConnected = Template.bind({ stopTracks: true });
NotConnected.parameters = {
  roomContext: { audio: false, video: false, connect: false },
};
