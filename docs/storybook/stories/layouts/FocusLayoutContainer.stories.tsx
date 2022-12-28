import React from 'react';

import { FocusLayoutContainerProps, FocusLayoutContainer } from '@livekit/components-react';
import { LkPinContext, LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: FocusLayoutContainer,
  decorators: [LkPinContext, LkRoomContext],
  render: (args: FocusLayoutContainerProps) => <FocusLayoutContainer {...args} />,
  argTypes: {
    hasFocus: {
      control: { type: 'boolean' },
      default: true,
    },
  },
};

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
