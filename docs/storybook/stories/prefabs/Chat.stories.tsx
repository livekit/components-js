import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';

import { Chat, ChatProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: Chat,
  decorators: [LkRoomContext],
  render: (args: ChatProps) => <Chat {...args}></Chat>,
  argTypes: {
    onActiveDeviceChange: { type: 'function' },
  },
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<ChatProps> = {
  args: {},
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};
