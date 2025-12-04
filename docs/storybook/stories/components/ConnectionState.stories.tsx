import * as React from 'react';
import { StoryObj, Meta } from '@storybook/react-vite';

import { ConnectionState, ConnectionStatusProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

const Story: Meta<typeof ConnectionState> = {
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

export default Story;

export const Default: StoryObj<ConnectionStatusProps> = {
  args: {},
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};
