import React from 'react';
import { StoryObj } from '@storybook/react';

import { ConnectionState, ConnectionStatusProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: ConnectionState,
  decorators: [LkRoomContext],
  render: (args: ConnectionStatusProps) => <ConnectionState {...args}></ConnectionState>,
  argTypes: {},
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<ConnectionStatusProps> = {
  args: {},
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};
