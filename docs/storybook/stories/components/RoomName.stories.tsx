import * as React from 'react';
import { StoryObj } from '@storybook/react';

import { RoomName, RoomNameProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: RoomName,
  decorators: [LkRoomContext],
  render: (args: RoomNameProps) => <RoomName {...args}></RoomName>,
  argTypes: {
    childrenPosition: {
      control: { type: 'select' },
      options: ['after', 'before'],
    },
  },
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<RoomNameProps> = {
  args: { childrenPosition: 'before' },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};

export const WithChildComponent: StoryObj<RoomNameProps> = {
  render: (args: RoomNameProps) => (
    <RoomName {...args}>
      <span style={{ color: 'red' }}> before or after </span>
    </RoomName>
  ),
  args: { childrenPosition: 'before' },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};
