import * as React from 'react';

import { GridLayout, GridLayoutProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: GridLayout,
  decorators: [LkRoomContext],
  render: (args: GridLayoutProps) => <GridLayout {...args} />,
  argTypes: {},
};

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
