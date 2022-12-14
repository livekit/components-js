import React from 'react';

import { FocusLayoutContainerProps, FocusLayoutContainer } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: FocusLayoutContainer,
  decorators: [LkRoomContext],
  render: (args: FocusLayoutContainerProps) => <FocusLayoutContainer {...args} />,
  argTypes: {},
};

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
