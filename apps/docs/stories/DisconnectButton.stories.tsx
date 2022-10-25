import React from 'react';

import { ComponentMeta } from '@storybook/react';

import { DisconnectButton } from '@livekit/components-react';
import { LkRoomContext } from '../.storybook/LkRoomContext';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Prefabs/DisconnectButton',
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
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Connected.parameters = {
  connect: true,
};

export const NotConnected = Template.bind({});
NotConnected.args = {
  stopTracks: true,
};
NotConnected.parameters = {
  connect: false,
};
