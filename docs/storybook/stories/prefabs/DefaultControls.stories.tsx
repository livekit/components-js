import React from 'react';
import { StoryObj } from '@storybook/react';

import { DefaultControls, DefaultControlsProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: DefaultControls,
  decorators: [LkRoomContext],
  render: (args: DefaultControlsProps) => <DefaultControls {...args} />,
  argTypes: {},
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<DefaultControlsProps> = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
