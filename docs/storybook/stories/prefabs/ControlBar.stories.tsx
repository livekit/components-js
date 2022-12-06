import React from 'react';
import { StoryObj } from '@storybook/react';

import { ControlBar, ControlBarProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: ControlBar,
  decorators: [LkRoomContext],
  render: (args: ControlBarProps) => <ControlBar {...args} />,
  argTypes: {},
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<ControlBarProps> = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
