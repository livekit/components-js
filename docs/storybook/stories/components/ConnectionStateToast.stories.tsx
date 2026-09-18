import * as React from 'react';
import { StoryObj, Meta } from '@storybook/react-vite';

import {
  //   ConnectionState,
  ConnectionStateToast,
  ConnectionStatusProps,
} from '@livekit/components-react';
// import { LkRoomContext } from '../../.storybook/lk-decorators';
import { Room, ConnectionState as State } from 'livekit-client';

const Story: Meta<typeof ConnectionStateToast> = {
  component: ConnectionStateToast,
  //   decorators: [LkRoomContext],
  render: (args: ConnectionStatusProps) => <ConnectionStateToast {...args}></ConnectionStateToast>,
  argTypes: {},
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export default Story;

function getRoomWithState(state: State) {
  const room = new Room();
  room.state = state;
  return room;
}

export const Default: StoryObj<ConnectionStatusProps> = {
  args: { room: getRoomWithState(State.Disconnected) },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};

export const Connecting: StoryObj<ConnectionStatusProps> = {
  args: { room: getRoomWithState(State.Connecting) },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};

export const Reconnecting: StoryObj<ConnectionStatusProps> = {
  args: { room: getRoomWithState(State.Reconnecting) },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};
