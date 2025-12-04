import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';

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

export const Minimal: StoryObj<ControlBarProps> = {
  args: { variation: 'minimal' },
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};

export const TextOnly: StoryObj<ControlBarProps> = {
  args: { variation: 'textOnly' },
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
